# Stride — Deployment & Architecture Guide
### Hackathon Edition · Open Payments + Interledger Protocol

---

## 1. What you built

Stride is a React + Vite single-page app with four financial modules, all sharing one wallet address per user. No backend is required to demo it — the UI is fully self-contained. When wiring in real payments, you add the Open Payments API calls without changing the UI structure.

---

## 2. Run it locally (same stack as CampusRide)

```bash
# 1. Create the project
npm create vite@latest stride -- --template react
cd stride
npm install

# 2. Replace src/App.jsx with Stride.jsx content

# 3. Start dev server
npm run dev
# Opens at http://localhost:5173
```

---

## 3. File structure

```
stride/
  src/
    App.jsx        ← paste Stride.jsx content here
    main.jsx       ← leave as-is
  index.html       ← leave as-is
  package.json
  vite.config.js
```

---

## 4. How Open Payments wires in (per module)

### PAY — Digital payslip
```
Employer app                     Stride (worker)
     │                               │
     │  1. Worker shares QR          │
     │  ◄── wallet address ──────────│
     │                               │
     │  2. Employer creates          │
     │     incoming payment          │
     │     (Open Payments grant)     │
     │  ──────────────────────────►  │
     │                               │
     │  3. Worker accepts grant      │
     │  4. Payment sent via ILP      │
     │  5. Transaction = payslip     │
```

**API call (employer side):**
```js
// Create an outgoing payment to worker's wallet
POST https://open-payments-server/outgoing-payments
{
  walletAddress: "$stride.pay/nomsa.dlamini",
  amount: { value: "280000", assetCode: "ZAR", assetScale: 2 },
  metadata: { type: "payslip", employer: "Khumalo Family", date: "2026-06-25" }
}
```

---

### SAVE — Stokvel
```
Stokvel group (5 members)
     │
     │  Each member → Open Payments incoming payment grant
     │  All payments → Stokvel wallet address
     │  Payout → Single outgoing payment to recipient wallet
     │  Every transaction → Immutable ILP record
```

**Key insight:** The stokvel pot IS a wallet address. No treasurer holds cash. The protocol holds it.

---

### SEND — Cross-border remittance
```
Stride (ZAR)  →  Interledger  →  Recipient wallet (USD/MZN/LSL/ZMW)
                      │
                      ├─ Automatic FX via ILP connectors
                      ├─ Fee: 0.3–0.5% (vs 5–12% traditional)
                      └─ Settlement: seconds (vs 1–3 days)
```

**OpenRemit integration (see section 6 below)**

---

### WORK — Job card
```
Worker generates QR  →  encodes wallet address + profile
Employer scans QR    →  opens payment flow directly
Payment sent         →  transaction added to work history
Work history         →  proof of income document
```

---

## 5. Environment variables (when going live)

Create a `.env` file in your project root:

```env
VITE_OPEN_PAYMENTS_HOST=https://your-wallet-provider.com
VITE_WALLET_ADDRESS=$stride.pay/nomsa.dlamini
VITE_CLIENT_ID=your_client_id
VITE_CLIENT_SECRET=your_client_secret
```

Access in code:
```js
const host = import.meta.env.VITE_OPEN_PAYMENTS_HOST
```

---

## 6. OpenRemit integration strategy

OpenRemit is an open-source remittance platform built on Interledger. Here is how to use its payment engine while keeping your own Stride UI:

### What to take from OpenRemit
- **ILP connector setup** — the routing logic that converts ZAR → USD/MZN etc
- **FX rate feeds** — live exchange rate data per corridor
- **Compliance hooks** — KYC/AML checks per corridor (required for real money)
- **Wallet provider connections** — existing integrations with mobile money in ZW/MZ/LS

### What to keep custom (Stride)
- The entire React UI (your design, your UX)
- The wallet address identity system
- The payslip generation logic
- The stokvel contribution tracking
- The job card / worker profile system

### Integration approach

```
Stride React UI
      │
      │  API calls
      ▼
Stride Backend (Node.js — you write this)
      │
      ├──► Open Payments SDK  (wallet, pay, payslip)
      │
      └──► OpenRemit Engine   (send module only)
                │
                └──► ILP Network → recipient country
```

### Minimal Node backend to connect them

```js
// server.js
import { createAuthenticatedClient } from "@interledger/open-payments"
import express from "express"

const app = express()

// OpenRemit handles the actual cross-border routing
// You call their /transfer endpoint, they handle the ILP connector
app.post("/api/send", async (req, res) => {
  const { senderWallet, recipientWallet, amount, currency } = req.body

  // 1. Create Open Payments outgoing payment
  const client = await createAuthenticatedClient({ ... })
  const payment = await client.outgoingPayment.create({
    url: senderWallet,
    body: {
      walletAddress: recipientWallet,
      incomingPayment: recipientWallet,
      debitAmount: { value: amount, assetCode: "ZAR", assetScale: 2 }
    }
  })

  // 2. OpenRemit handles FX + corridor routing from here
  res.json({ txnId: payment.id, status: "sent" })
})
```

---

## 7. Deploy to the web (free, 5 minutes)

### Option A — Vercel (recommended)
```bash
npm install -g vercel
vercel
# Follow prompts — your app is live at https://stride-xxx.vercel.app
```

### Option B — Netlify
```bash
npm run build
# Drag the dist/ folder to netlify.com/drop
```

### Option C — GitHub Pages
```bash
# In vite.config.js, add: base: '/stride/'
npm run build
# Push dist/ to gh-pages branch
```

---

## 8. Hackathon demo checklist

- [ ] Dashboard opens with user balance and 4 module tiles
- [ ] PAY: Generate a QR code with wallet address and show payslip history
- [ ] WORK: Show worker card QR, add a job, view active/upcoming jobs
- [ ] SAVE: Show stokvel pot, mark member as paid, run a payout
- [ ] SEND: Enter amount, pick Zimbabwe corridor, show fee saving vs Mukuru, complete transfer
- [ ] All 4 modules share the same wallet address (show this to judges)
- [ ] Explain: "Same infrastructure, one identity, three problems solved"

---

## 9. The pitch in one sentence

> Stride gives every informal worker a single wallet address — one portable financial identity that earns verifiable wages, saves transparently in a stokvel, and sends money home across borders at near-zero cost, all without a bank account.
