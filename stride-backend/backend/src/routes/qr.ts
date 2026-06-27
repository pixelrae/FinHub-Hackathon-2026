import { Router } from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { users } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";
import { generateQrPng, getQrPath, slugify } from "../lib/qrGenerator";
import { config } from "../config";

export const qrRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/qr/generate
//
// Generates a QR code PNG for the employee's payment page.
// The QR encodes: https://<BACKEND_URL>/pay/<walletHandle>
// ─────────────────────────────────────────────────────────────────────────────
qrRouter.post("/generate", requireAuth, async (req, res, next) => {
    try {
        const user = req.user!;

        // Slugify display name into a wallet handle
        const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, user.id));

        if (!dbUser) {
            return res.status(404).json({ error: "User not found" });
        }

        if (!dbUser.walletAddress) {
            return res.status(400).json({
                error: "Please set your wallet address before generating a QR code",
            });
        }

        const baseHandle = slugify(dbUser.displayName);
        let walletHandle = baseHandle;

        // Check if handle is taken by another user
        const [existing] = await db
            .select()
            .from(users)
            .where(eq(users.walletHandle, baseHandle));

        if (existing && existing.id !== user.id) {
            // Append random suffix to make unique
            walletHandle = `${baseHandle}-${crypto.randomBytes(3).toString("hex")}`;
        }

        const qrToken = crypto.randomUUID();
        const paymentPageUrl = `${config.backendUrl}/pay/${walletHandle}`;

        // Generate QR PNG
        await generateQrPng(paymentPageUrl, user.id);

        // Save handle and token to DB
        await db
            .update(users)
            .set({ walletHandle, qrToken })
            .where(eq(users.id, user.id));

        res.json({
            walletHandle,
            paymentPageUrl,
            qrUrl: `${config.backendUrl}/api/qr/download`,
        });
    } catch (err) {
        next(err);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/qr/download
//
// Streams the employee's QR PNG for saving or printing.
// ─────────────────────────────────────────────────────────────────────────────
qrRouter.get("/download", requireAuth, async (req, res, next) => {
    try {
        const user = req.user!;
        const filePath = getQrPath(user.id);

        if (!fs.existsSync(filePath)) {
            return res
                .status(404)
                .json({ error: "QR code not found. Generate one first." });
        }

        res.setHeader("Content-Type", "image/png");
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="stride-qr.png"',
        );
        fs.createReadStream(filePath).pipe(res);
    } catch (err) {
        next(err);
    }
});
