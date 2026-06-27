import PDFDocument from "pdfkit";
import crypto from "node:crypto";
import { type Response } from "express";

export interface ReportTransaction {
    id: string;
    createdAt: Date;
    payerRef: string | null;
    counterpartyName: string | null;
    receiveAmount: string | null;
    receiveAssetCode: string | null;
    receiveAssetScale: number | null;
    description: string | null;
}

export interface ReportOptions {
    employeeName: string;
    walletAddress: string;
    from: string;
    to: string;
    transactions: ReportTransaction[];
    userId: string;
    res: Response;
}

function formatAmount(value: string | null, scale: number | null): string {
    if (!value || scale === null) return "0.00";
    return (parseInt(value) / Math.pow(10, scale)).toFixed(2);
}

function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-ZA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function generateHmac(
    userId: string,
    from: string,
    to: string,
    totalAmount: string,
    secret: string,
): string {
    const input = `${userId}|${from}|${to}|${totalAmount}`;
    return crypto.createHmac("sha256", secret).update(input).digest("hex");
}

export function buildReport(options: ReportOptions): void {
    const { employeeName, walletAddress, from, to, transactions, userId, res } =
        options;
    const secret = process.env.REPORT_SECRET || "stride-report-secret-2026";

    const totalCents = transactions.reduce((sum, t) => {
        return sum + (t.receiveAmount ? parseInt(t.receiveAmount) : 0);
    }, 0);

    const scale = transactions[0]?.receiveAssetScale ?? 2;
    const totalAmount = (totalCents / Math.pow(10, scale)).toFixed(2);
    const currency = transactions[0]?.receiveAssetCode ?? "ZAR";
    const avgAmount =
        transactions.length > 0
            ? (totalCents / transactions.length / Math.pow(10, scale)).toFixed(
                  2,
              )
            : "0.00";

    const hmac = generateHmac(userId, from, to, totalAmount, secret);

    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="stride-income-report.pdf"`,
    );
    doc.pipe(res);

    // ─── HEADER ───────────────────────────────────────────────
    doc.fontSize(28)
        .fillColor("#1a6b6b")
        .font("Helvetica-Bold")
        .text("Stride", 50, 50);

    doc.fontSize(11)
        .fillColor("#888888")
        .font("Helvetica")
        .text("Proof of Income Report", 50, 82);

    doc.moveTo(50, 105)
        .lineTo(545, 105)
        .strokeColor("#1a6b6b")
        .lineWidth(1.5)
        .stroke();

    // ─── EMPLOYEE INFO ────────────────────────────────────────
    doc.fontSize(10)
        .fillColor("#aaaaaa")
        .font("Helvetica-Bold")
        .text("EMPLOYEE", 50, 120);

    doc.fontSize(13)
        .fillColor("#2d2d2d")
        .font("Helvetica-Bold")
        .text(employeeName, 50, 135);

    doc.fontSize(10)
        .fillColor("#888888")
        .font("Helvetica")
        .text(walletAddress, 50, 152);

    // ─── PERIOD ───────────────────────────────────────────────
    doc.fontSize(10)
        .fillColor("#aaaaaa")
        .font("Helvetica-Bold")
        .text("REPORT PERIOD", 350, 120);

    doc.fontSize(11)
        .fillColor("#2d2d2d")
        .font("Helvetica")
        .text(`${from} to ${to}`, 350, 135);

    doc.moveTo(50, 175)
        .lineTo(545, 175)
        .strokeColor("#eeeeee")
        .lineWidth(1)
        .stroke();

    // ─── SUMMARY BLOCK ────────────────────────────────────────
    doc.rect(50, 185, 495, 80).fillColor("#e8f4f4").fill();

    doc.fontSize(10)
        .fillColor("#1a6b6b")
        .font("Helvetica-Bold")
        .text("TOTAL EARNED", 70, 200);

    doc.fontSize(22)
        .fillColor("#1a6b6b")
        .font("Helvetica-Bold")
        .text(`${currency} ${totalAmount}`, 70, 215);

    doc.fontSize(10)
        .fillColor("#1a6b6b")
        .font("Helvetica")
        .text(
            `${transactions.length} payment${transactions.length !== 1 ? "s" : ""}`,
            70,
            245,
        );

    doc.fontSize(10)
        .fillColor("#1a6b6b")
        .font("Helvetica-Bold")
        .text("AVERAGE PER PAYMENT", 300, 200);

    doc.fontSize(16)
        .fillColor("#1a6b6b")
        .font("Helvetica-Bold")
        .text(`${currency} ${avgAmount}`, 300, 215);

    // ─── TRANSACTION TABLE ────────────────────────────────────
    const tableTop = 290;

    doc.fontSize(10)
        .fillColor("#aaaaaa")
        .font("Helvetica-Bold")
        .text("DATE", 50, tableTop)
        .text("EMPLOYER", 150, tableTop)
        .text("DESCRIPTION", 290, tableTop)
        .text("AMOUNT", 470, tableTop, { align: "right", width: 75 });

    doc.moveTo(50, tableTop + 16)
        .lineTo(545, tableTop + 16)
        .strokeColor("#dddddd")
        .lineWidth(1)
        .stroke();

    let y = tableTop + 24;

    transactions.forEach((t, i) => {
        if (y > 700) {
            doc.addPage();
            y = 50;
        }

        const bgColor = i % 2 === 0 ? "#ffffff" : "#f9f9f9";
        doc.rect(50, y - 4, 495, 22)
            .fillColor(bgColor)
            .fill();

        const employer = t.payerRef || t.counterpartyName || "Unknown";
        const description = t.description || "—";
        const amount = formatAmount(t.receiveAmount, t.receiveAssetScale);
        const date = formatDate(t.createdAt);

        doc.fontSize(9)
            .fillColor("#2d2d2d")
            .font("Helvetica")
            .text(date, 50, y, { width: 90 })
            .text(employer, 150, y, { width: 130 })
            .text(description, 290, y, { width: 170 })
            .text(`${currency} ${amount}`, 470, y, {
                align: "right",
                width: 75,
            });

        y += 22;
    });

    doc.moveTo(50, y)
        .lineTo(545, y)
        .strokeColor("#dddddd")
        .lineWidth(1)
        .stroke();

    // ─── FOOTER ───────────────────────────────────────────────
    const footerY = y + 30;

    doc.moveTo(50, footerY)
        .lineTo(545, footerY)
        .strokeColor("#1a6b6b")
        .lineWidth(1)
        .stroke();

    doc.fontSize(8)
        .fillColor("#aaaaaa")
        .font("Helvetica")
        .text("This report is digitally signed. Verify at:", 50, footerY + 10);

    doc.fontSize(8)
        .fillColor("#1a6b6b")
        .text(
            `${process.env.BACKEND_URL || "http://localhost:3001"}/api/report/verify?sig=${hmac}&userId=${userId}&from=${from}&to=${to}&total=${totalAmount}`,
            50,
            footerY + 22,
            { width: 495 },
        );

    doc.fontSize(7)
        .fillColor("#cccccc")
        .text(`HMAC-SHA256: ${hmac}`, 50, footerY + 46, { width: 495 });

    doc.fontSize(8)
        .fillColor("#aaaaaa")
        .text(
            `Generated by Stride · Powered by Interledger · ${new Date().toISOString()}`,
            50,
            footerY + 58,
            { align: "center", width: 495 },
        );

    doc.end();
}
