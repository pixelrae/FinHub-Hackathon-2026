import QRCode from "qrcode";
import path from "node:path";
import fs from "node:fs/promises";

const QR_DIR = path.join(process.cwd(), "uploads", "qr");

export async function ensureQrDir(): Promise<void> {
    await fs.mkdir(QR_DIR, { recursive: true });
}

export function getQrPath(userId: string): string {
    return path.join(QR_DIR, `${userId}.png`);
}

export async function generateQrPng(
    url: string,
    userId: string,
): Promise<string> {
    await ensureQrDir();
    const filePath = getQrPath(userId);
    await QRCode.toFile(filePath, url, {
        type: "png",
        width: 400,
        margin: 2,
        color: {
            dark: "#1a6b6b",
            light: "#ffffff",
        },
    });
    return filePath;
}

export function slugify(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}
