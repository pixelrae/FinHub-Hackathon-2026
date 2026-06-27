import { Router } from "express";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db } from "../db";
import { transactions, users } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";
import { buildReport, generateHmac } from "../lib/reportBuilder";

export const reportRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/report/generate?from=YYYY-MM-DD&to=YYYY-MM-DD
//
// Streams a signed PDF proof-of-income report for the logged-in employee.
// ─────────────────────────────────────────────────────────────────────────────
reportRouter.get("/generate", requireAuth, async (req, res, next) => {
    try {
        const { from, to } = req.query as { from: string; to: string };

        if (!from || !to) {
            return res
                .status(400)
                .json({ error: "Missing from or to query parameters" });
        }

        const fromDate = new Date(from);
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return res
                .status(400)
                .json({ error: "Invalid date format. Use YYYY-MM-DD" });
        }

        const me = req.user!;

        const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, me.id));

        if (!dbUser) {
            return res.status(404).json({ error: "User not found" });
        }

        if (!dbUser.walletAddress) {
            return res
                .status(400)
                .json({ error: "No wallet address set on your account" });
        }

        // Fetch all completed received transactions in the date range
        const txs = await db
            .select({
                id: transactions.id,
                createdAt: transactions.createdAt,
                payerRef: transactions.payerRef,
                receiveAmount: transactions.receiveAmount,
                receiveAssetCode: transactions.receiveAssetCode,
                receiveAssetScale: transactions.receiveAssetScale,
                description: transactions.description,
                counterpartyName: users.displayName,
            })
            .from(transactions)
            .leftJoin(users, eq(users.id, transactions.userId))
            .where(
                and(
                    eq(
                        transactions.receiverWalletAddress,
                        dbUser.walletAddress,
                    ),
                    eq(transactions.status, "COMPLETED"),
                    gte(transactions.createdAt, fromDate),
                    lte(transactions.createdAt, toDate),
                ),
            )
            .orderBy(desc(transactions.createdAt))
            .all();

        if (txs.length === 0) {
            return res
                .status(404)
                .json({ error: "No completed payments found for this period" });
        }

        buildReport({
            employeeName: dbUser.displayName,
            walletAddress: dbUser.walletAddress,
            from,
            to,
            transactions: txs,
            userId: me.id,
            res,
        });
    } catch (err) {
        next(err);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/report/verify?sig=<hex>&userId=<id>&from=<ISO>&to=<ISO>&total=<n>
//
// Public endpoint. Verifies the HMAC signature on a report.
// ─────────────────────────────────────────────────────────────────────────────
reportRouter.get("/verify", async (req, res) => {
    const { sig, userId, from, to, total } = req.query as {
        sig: string;
        userId: string;
        from: string;
        to: string;
        total: string;
    };

    if (!sig || !userId || !from || !to || !total) {
        return res
            .status(400)
            .json({ error: "Missing required query parameters" });
    }

    const secret = process.env.REPORT_SECRET || "stride-report-secret-2026";
    const expected = generateHmac(userId, from, to, total, secret);
    const valid = expected === sig;

    res.json({ valid });
});
