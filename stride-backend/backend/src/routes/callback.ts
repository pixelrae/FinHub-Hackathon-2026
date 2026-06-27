import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { transactions, paymentRequests, postUnlocks } from "../db/schema";
import { getClient, isFinalizedGrant } from "../lib/openPayments";
import { config } from "../config";

export const callbackRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/callback
//
// GNAP redirect endpoint — the auth server redirects the user's browser here
// after they complete (or deny) consent.
//
// Query params supplied by the auth server:
//   interact_ref   — exchange token used to continue the grant
//   hash           — GNAP hash for verifying the callback (optional verification)
//
// Query param we added to the callback URL in /consent:
//   transactionId  — our DB row to update
//
// Steps:
//   1. Load the transaction and validate state
//   2. Continue the grant with interact_ref → receive access token
//   3. Create the outgoing payment
//   4. Mark the transaction COMPLETED and redirect the browser to the frontend
// ─────────────────────────────────────────────────────────────────────────────
callbackRouter.get("/", async (req, res) => {
    // On success the auth server sends `interact_ref`. On rejection it sends
    // `result=grant_rejected` (and no interact_ref) — that's the user clicking
    // "Decline" at their wallet's consent page.
    const { interact_ref, transactionId, result } = req.query as Record<
        string,
        string
    >;

    if (!transactionId) {
        return res.status(400).send("Missing transactionId in callback query");
    }

    const [tx] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, transactionId));

    if (!tx || tx.status !== "AWAITING_GRANT") {
        return res.redirect(
            `${config.frontendUrl}?status=failed&id=${transactionId}&reason=invalid_state`,
        );
    }

    // If this transaction unlocks a News post, send the reader back to that
    // article on return (on either outcome) instead of the generic status view.
    const [unlock] = await db
        .select({ postId: postUnlocks.postId })
        .from(postUnlocks)
        .where(
            and(
                eq(postUnlocks.transactionId, transactionId),
                eq(postUnlocks.status, "PENDING"),
            ),
        );
    const postSuffix = unlock ? `&post=${unlock.postId}` : "";

    // User declined consent (or the auth server returned no interact_ref): the
    // grant was rejected, so there's nothing to continue. Mark the payment failed
    // with a friendly reason and send them back to the app. Any linked ask/unlock
    // stays PENDING (handled like every other failure), so a retry is possible.
    if (!interact_ref || result === "grant_rejected") {
        await db
            .update(transactions)
            .set({
                status: "FAILED",
                errorMessage:
                    result === "grant_rejected"
                        ? "Payment declined — you cancelled the authorisation at your wallet."
                        : "Authorisation did not complete. Please try the payment again.",
                updatedAt: new Date(),
            })
            .where(eq(transactions.id, transactionId));

        return res.redirect(
            `${config.frontendUrl}?status=failed&id=${transactionId}${postSuffix}`,
        );
    }

    try {
        const client = await getClient();

        // Continue the grant — exchanges interact_ref for an outgoing-payment access token
        const finalizedGrant = await client.grant.continue(
            {
                url: tx.grantContinueUri!,
                accessToken: tx.grantContinueToken!,
            },
            { interact_ref },
        );

        if (!isFinalizedGrant(finalizedGrant)) {
            throw new Error(
                "Grant continuation did not return an access token. Consent may have been denied or expired.",
            );
        }

        // Resolve the sender's resource server URL to create the outgoing payment
        const sendingWallet = await client.walletAddress.get({
            url: tx.senderWalletAddress,
        });

        // Create the outgoing payment using the previously created quote
        const outgoingPayment = await client.outgoingPayment.create(
            {
                url: sendingWallet.resourceServer,
                accessToken: finalizedGrant.access_token.value,
            },
            {
                walletAddress: sendingWallet.id,
                quoteId: tx.quoteUrl!, // quoteId = full quote URL from Step 5 of /quote
                metadata: { description: "OpenRemit payment" },
            },
        );

        await db
            .update(transactions)
            .set({
                status: "COMPLETED",
                outgoingPaymentUrl: outgoingPayment.id,
                updatedAt: new Date(),
            })
            .where(eq(transactions.id, transactionId));

        // If this payment fulfils a payment request, close the request too.
        // (On failure the request stays PENDING so the payer can retry.)
        await db
            .update(paymentRequests)
            .set({ status: "COMPLETED", updatedAt: new Date() })
            .where(
                and(
                    eq(paymentRequests.transactionId, transactionId),
                    eq(paymentRequests.status, "PENDING"),
                ),
            );

        // If this payment unlocks a News post, grant access.
        await db
            .update(postUnlocks)
            .set({ status: "COMPLETED", updatedAt: new Date() })
            .where(
                and(
                    eq(postUnlocks.transactionId, transactionId),
                    eq(postUnlocks.status, "PENDING"),
                ),
            );

        const isPhone = req.headers["user-agent"]?.includes("Mobile");
        if (isPhone) {
            return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Payment Complete</title>
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
              padding: 40px 24px;
              text-align: center;
              max-width: 360px;
              width: 100%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.10);
            }
            .icon {
              width: 72px;
              height: 72px;
              border-radius: 50%;
              background: #1a6b6b;
              color: white;
              font-size: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
            }
            h2 { color: #2d2d2d; margin-bottom: 12px; }
            p { color: #888; font-size: 14px; line-height: 1.6; }
            .stride { color: #1a6b6b; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h2>Payment Complete</h2>
            <p>Your payment has been sent successfully via <span class="stride">Stride</span>. The worker's payslip has been generated automatically.</p>
          </div>
        </body>
        </html>
      `);
        }
        const isPhoneFail = req.headers["user-agent"]?.includes("Mobile");
        if (isPhoneFail) {
            return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Payment Failed</title>
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
              padding: 40px 24px;
              text-align: center;
              max-width: 360px;
              width: 100%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.10);
            }
            .icon {
              width: 72px;
              height: 72px;
              border-radius: 50%;
              background: #cc0000;
              color: white;
              font-size: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
            }
            h2 { color: #cc0000; margin-bottom: 12px; }
            p { color: #888; font-size: 14px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✕</div>
            <h2>Payment Failed</h2>
            <p>Something went wrong. Please try scanning the QR code again.</p>
          </div>
        </body>
        </html>
      `);
        }
        return res.redirect(
            `${config.frontendUrl}?status=failed&id=${transactionId}${postSuffix}`,
        );
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[callback] Payment failed:", message);

        await db
            .update(transactions)
            .set({
                status: "FAILED",
                errorMessage: message,
                updatedAt: new Date(),
            })
            .where(eq(transactions.id, transactionId));

        const isPhoneFail = req.headers["user-agent"]?.includes("Mobile");
        if (isPhoneFail) {
            return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Payment Failed</title>
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
              padding: 40px 24px;
              text-align: center;
              max-width: 360px;
              width: 100%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.10);
            }
            .icon {
              width: 72px;
              height: 72px;
              border-radius: 50%;
              background: #cc0000;
              color: white;
              font-size: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
            }
            h2 { color: #cc0000; margin-bottom: 12px; }
            p { color: #888; font-size: 14px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✕</div>
            <h2>Payment Failed</h2>
            <p>Something went wrong. Please try scanning the QR code again.</p>
          </div>
        </body>
        </html>
      `);
        }
        return res.redirect(
            `${config.frontendUrl}?status=failed&id=${transactionId}${postSuffix}`,
        );
    }
});
