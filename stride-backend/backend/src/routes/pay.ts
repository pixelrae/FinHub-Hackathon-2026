import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { createQuoteTransaction } from "../lib/quoteFlow";
import { getClient, normaliseWalletAddress } from "../lib/openPayments";
import { isPendingGrant } from "@interledger/open-payments";
import { config } from "../config";
import crypto from "node:crypto";
import { transactions } from "../db/schema";

export const payRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /pay/:handle
//
// Public employer pay page. No auth required.
// Renders an HTML page where the employer enters their wallet address and
// the amount to pay. On submit, drives the full Open Payments flow.
// ─────────────────────────────────────────────────────────────────────────────
payRouter.get("/:handle", async (req, res, next) => {
    try {
        const { handle } = req.params;

        const [employee] = await db
            .select()
            .from(users)
            .where(eq(users.walletHandle, handle));

        if (!employee) {
            return res.status(404).send(renderPayPage(null, handle, null));
        }

        res.send(renderPayPage(employee.displayName, handle, null));
    } catch (err) {
        next(err);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /pay/:handle
//
// Employer submits their wallet address and amount.
// Drives: resolve wallets -> incoming payment -> quote -> GNAP consent redirect
// ─────────────────────────────────────────────────────────────────────────────
payRouter.post("/:handle", async (req, res, next) => {
    try {
        const handle = req.params.handle;
        const { employerWallet, employerName, amount, description } =
            req.body as {
                employerWallet: string;
                employerName: string;
                amount: string;
                description: string;
            };

        if (!employerWallet || !employerName || !amount || !description) {
            return res
                .status(400)
                .send(renderPayPage(null, handle, "All fields are required."));
        }

        const [employee] = await db
            .select()
            .from(users)
            .where(eq(users.walletHandle, handle));

        if (!employee || !employee.walletAddress) {
            return res
                .status(404)
                .send(renderPayPage(null, handle, "Employee not found."));
        }

        // Resolve employer wallet to get asset scale
        const client = await getClient();
        const employerWalletUrl = normaliseWalletAddress(employerWallet);
        const employerWalletData = await client.walletAddress.get({
            url: employerWalletUrl,
        });

        const scaledAmount = String(
            Math.round(
                parseFloat(amount) *
                    Math.pow(10, employerWalletData.assetScale),
            ),
        );

        // Run quote flow with employer as sender
        const result = await createQuoteTransaction({
            senderWalletAddress: employerWalletUrl,
            receiverWalletAddress: employee.walletAddress,
            amount: scaledAmount,
            paymentType: "FIXED_RECEIVE",
            description,
            userId: null,
        });

        // Request interactive GNAP outgoing-payment grant on employer's wallet
        const sendingWallet = await client.walletAddress.get({
            url: employerWalletUrl,
        });
        const nonce = crypto.randomUUID();
        const callbackUrl = `${config.backendUrl}/api/callback?transactionId=${result.transactionId}`;

        const outgoingGrant = await client.grant.request(
            { url: sendingWallet.authServer },
            {
                access_token: {
                    access: [
                        {
                            type: "outgoing-payment",
                            actions: ["create", "read"],
                            identifier: sendingWallet.id,
                            limits: {
                                debitAmount: {
                                    value: result.quote.debitAmount.value,
                                    assetCode:
                                        result.quote.debitAmount.assetCode,
                                    assetScale:
                                        result.quote.debitAmount.assetScale,
                                },
                            },
                        },
                    ],
                },
                interact: {
                    start: ["redirect"],
                    finish: {
                        method: "redirect",
                        uri: callbackUrl,
                        nonce,
                    },
                },
            },
        );

        if (
            !isPendingGrant(outgoingGrant) ||
            !outgoingGrant.interact?.redirect
        ) {
            throw new Error("Expected interactive outgoing-payment grant");
        }

        // Persist grant continuation details
        await db
            .update(transactions)
            .set({
                status: "AWAITING_GRANT",
                grantContinueUri: outgoingGrant.continue.uri,
                grantContinueToken: outgoingGrant.continue.access_token.value,
                grantInteractNonce: nonce,
                receiverUserId: employee.id,
                payerRef: employerName,
                updatedAt: new Date(),
            })
            .where(eq(transactions.id, result.transactionId));

        // Redirect employer to their bank's consent screen
        res.redirect(outgoingGrant.interact.redirect);
    } catch (err: any) {
        console.error("[pay] Error:", err.message);
        next(err);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// HTML renderer for the pay page
// ─────────────────────────────────────────────────────────────────────────────
function renderPayPage(
    employeeName: string | null,
    handle: string,
    error: string | null,
): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${employeeName ? `Pay ${employeeName}` : "Stride Pay"}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 32px 24px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.10);
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #1a6b6b;
      letter-spacing: 2px;
      margin-bottom: 4px;
    }
    .subtitle {
      font-size: 13px;
      color: #888;
      margin-bottom: 24px;
    }
    .employee-name {
      font-size: 20px;
      font-weight: bold;
      color: #2d2d2d;
      margin-bottom: 24px;
      padding: 16px;
      background: #e8f4f4;
      border-radius: 10px;
      text-align: center;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 16px;
    }
    label {
      font-size: 13px;
      font-weight: bold;
      color: #2d2d2d;
    }
    input, textarea {
      padding: 14px 16px;
      border-radius: 10px;
      border: 1px solid #ddd;
      font-size: 15px;
      font-family: Arial, sans-serif;
      outline: none;
      width: 100%;
    }
    textarea { resize: none; }
    .hint {
      font-size: 11px;
      color: #aaa;
      font-style: italic;
    }
    .btn {
      width: 100%;
      padding: 16px;
      background: #1a6b6b;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      margin-top: 8px;
    }
    .error {
      background: #fff0f0;
      border: 1px solid #ffcccc;
      border-radius: 8px;
      padding: 12px 16px;
      color: #cc0000;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .not-found {
      text-align: center;
      color: #888;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Stride</div>
    <div class="subtitle">Secure payment powered by Interledger</div>
    ${
        !employeeName
            ? `
      <div class="not-found">
        <p>Payment page not found.</p>
        <p style="margin-top:8px;font-size:12px;">The link you scanned may be invalid or expired.</p>
      </div>
    `
            : `
      ${error ? `<div class="error">${error}</div>` : ""}
      <div class="employee-name">Pay ${employeeName}</div>
      <form method="POST" action="/pay/${handle}">
        <div class="field">
          <label>Your Name</label>
          <input
            type="text"
            name="employerName"
            placeholder="e.g. John Smith"
            required
          />
        </div>
        <div class="field">
          <label>Your Wallet Address</label>
          <input
            type="text"
            name="employerWallet"
            placeholder="https://ilp.interledger-test.dev/yourwallet"
            required
          />
          <span class="hint">Your Open Payments wallet address from your bank</span>
        </div>
        <div class="field">
          <label>Amount (ZAR)</label>
          <input
            type="number"
            name="amount"
            placeholder="800"
            min="1"
            step="0.01"
            required
          />
        </div>
        <div class="field">
          <label>Work Description</label>
          <textarea
            name="description"
            rows="3"
            placeholder="e.g. House cleaning, 5 days, June week 4"
            required
          ></textarea>
          <span class="hint">This appears on the worker's proof of income</span>
        </div>
        <button type="submit" class="btn">Pay Now</button>
      </form>
    `
    }
  </div>
</body>
</html>
  `;
}
