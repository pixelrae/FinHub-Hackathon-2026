# Stride — Functional Requirements

> **Scope:** Payslip & Income History feature (primary), Web Monetisation (stretch goal)
> **Hackathon:** 2026 UCT Interledger Bootcamp & Hackathon, Cape Town
> **Base template:** [OpenRemit](https://github.com/marclevin/OpenRemit)
> **Stack:** Node.js + Express + Drizzle ORM + SQLite · React + Vite · `@interledger/open-payments` SDK

---

## 1. Context & Constraints

Stride is built on top of OpenRemit, which already provides:

- A complete Open Payments send/receive flow (quote → consent → GNAP redirect → callback → outgoing payment)
- JWT-based auth (`/api/auth/signup`, `/api/auth/login`)
- A `transactions` table that records sender, receiver, amount, currency, date, status, and a `description` field
- A payment history route (`GET /api/remit/history`)
- A payment status route (`GET /api/remit/status/:id`)

**Stride does not replace any of this.** It extends it. Every payment in the demo is a live transaction on the Interledger TestNet — no mocking or simulation.

---

## 2. Primary Feature: Payslip & Income History

### 2.1 Overview

The payslip feature turns OpenRemit's existing transaction record into a verifiable proof of income for informal workers. When a worker receives a payment through Stride, that completed transaction becomes a digital payslip — showing employer name, worker name, amount, date, work description, and a unique transaction ID anchored to the Open Payments record.

The worker accesses this from their income history view, which works like the payments section of a banking app: a filterable list of received payments, from which any individual transaction can be rendered as a formal payslip.

### 2.2 The One Backend Change: Mandatory Description

The only required backend change for the payslip feature is making `description` a mandatory field on the payment quote endpoint.

**File:** `backend/src/routes/remit.ts`
**Change:** Validate that `description` is present and non-empty in `POST /api/remit/quote`. Return a `400` with a clear error message if it is missing.

```typescript
// In POST /api/remit/quote request body validation:
if (!body.description || body.description.trim() === '') {
  return res.status(400).json({ error: 'Payment description is required' });
}
```

The `description` field already exists in the `transactions` table. No schema migration is needed.

**Run after any schema changes:**
```bash
npm run db:push
```

### 2.3 Backend Routes

One new route is needed to support fetching a single transaction for the payslip view.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/remit/history` | Bearer | Already exists — returns the current user's sent payments. **Extend to also return received payments** (filter by `receiverWalletAddress = req.user.walletAddress`) |
| `GET` | `/api/remit/history/:id` | Bearer | **New.** Returns a single transaction by ID. Must verify the requesting user is either the sender or receiver. Returns `404` if not found or not authorised. |

#### `GET /api/remit/history` — extended response shape

Add a `type` field to each transaction in the response so the frontend can distinguish income from outgoing payments:

```typescript
{
  id: string,
  type: 'SENT' | 'RECEIVED',
  counterpartyName: string,       // display name of the other party
  counterpartyWalletAddress: string,
  amount: number,
  currency: string,
  description: string,
  status: 'PENDING' | 'AWAITING_GRANT' | 'COMPLETED' | 'FAILED',
  createdAt: string               // ISO 8601
}
```

#### `GET /api/remit/history/:id` — response shape

Same shape as a single item from the history list above, used to render the payslip view.

**File:** `backend/src/routes/remit.ts`
**Wire in:** `backend/src/index.ts`
**Frontend wrapper:** `frontend/src/api.ts`

### 2.4 Frontend Views

Two new React views are needed. Both are read-only — no new payment flows.

---

#### View 1: Income History (`/income`)

**File:** `frontend/src/views/IncomeHistoryView.tsx`

This is the worker's primary view. It shows all completed incoming payments with filtering controls, matching the pattern of a banking app's transaction history.

**Layout:**

```
[ Filter by date range: From ______ To ______ ]   [ Filter ]

─────────────────────────────────────────────────────────
  Employer Name          Description              Amount
  14 June 2026           House cleaning, 5 days   R 800.00    [ View Payslip ]
─────────────────────────────────────────────────────────
  Employer Name          Description              Amount
  31 May 2026            Gardening, 2 days        R 400.00    [ View Payslip ]
─────────────────────────────────────────────────────────
```

**Behaviour:**

- Fetches from `GET /api/remit/history` filtered to `type === 'RECEIVED'` and `status === 'COMPLETED'`
- Date range filter is applied client-side on the fetched results (no new query params needed for MVP)
- Defaults to showing all time on first load
- "View Payslip" navigates to `/payslip/:id`
- Empty state: "No income payments yet. Share your wallet address with your employer to get started."
- Loading state: skeleton rows while fetching

**Routing:** Add `#/income` to the hash router in `frontend/src/main.ts` (or the React Router equivalent).

---

#### View 2: Payslip (`/payslip/:id`)

**File:** `frontend/src/views/PayslipView.tsx`

Renders a single transaction as a formal digital payslip. This is the document the worker can screenshot or share with a landlord, bank, or credit provider.

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  STRIDE                               [Stride logo/mark] │
│  Digital Payslip                                         │
├─────────────────────────────────────────────────────────┤
│  EMPLOYER                           WORKER               │
│  [counterparty display name]        [user display name]  │
│  [employer wallet address]          [worker wallet addr] │
├─────────────────────────────────────────────────────────┤
│  Payment Date        Amount          Currency            │
│  14 June 2026        800.00          ZAR                 │
├─────────────────────────────────────────────────────────┤
│  Work Description                                        │
│  House cleaning, 5 days, June week 4                     │
├─────────────────────────────────────────────────────────┤
│  Transaction ID                                          │
│  [uuid from transactions table]                          │
│                                                          │
│  Verified on the Interledger Network                     │
│  Status: COMPLETED                                       │
└─────────────────────────────────────────────────────────┘

[ ← Back to Income History ]     [ Share ]
```

**Behaviour:**

- Fetches from `GET /api/remit/history/:id`
- Returns `404` view if the transaction is not found or the user is not the receiver
- The "Share" button behaviour is an **open decision** — see Section 4
- All user-entered content (description, display names) must be passed through `escapeHtml()` before rendering if using raw HTML interpolation

**Routing:** Add `#/payslip/:id` to the hash router in `frontend/src/main.ts`.

---

### 2.5 Changes Summary

| File | Change | Type |
|------|--------|------|
| `backend/src/routes/remit.ts` | Validate `description` is non-empty in `POST /api/remit/quote` | Modify |
| `backend/src/routes/remit.ts` | Extend `GET /api/remit/history` to include received payments with `type` field | Modify |
| `backend/src/routes/remit.ts` | Add `GET /api/remit/history/:id` single transaction route | New |
| `backend/src/index.ts` | Wire `GET /api/remit/history/:id` | Modify |
| `frontend/src/api.ts` | Add typed wrapper for `GET /api/remit/history/:id` and updated history response | Modify |
| `frontend/src/views/IncomeHistoryView.tsx` | Income history with date filtering | New |
| `frontend/src/views/PayslipView.tsx` | Formal payslip rendering | New |
| `frontend/src/main.ts` (or router) | Add `#/income` and `#/payslip/:id` routes | Modify |
| `frontend/src/views/quoteView.tsx` | Make description field required (UI validation) | Modify |

---

### 2.6 Demo Flow (Nomsa's Week)

This is the scripted demo path for the judges. Every step is a live TestNet transaction.

1. **Employer pays Nomsa** — employer opens Stride, enters Nomsa's wallet address (`$stride.interledger-test.dev/nomsa`), enters amount R800, enters description *"House cleaning, 5 days, June week 4"*, completes the GNAP consent flow
2. **Nomsa views her income** — Nomsa logs in, opens Income History, sees the completed R800 payment
3. **Nomsa views her payslip** — Nomsa clicks "View Payslip" on the R800 transaction, sees the formatted payslip with employer name, amount, description, and transaction ID
4. **Nomsa shares the payslip** — Nomsa uses the Share button to demonstrate proof of income (exact share behaviour TBD — see Section 4)

---

## 3. Stretch Feature: Web Monetisation

> **Status:** Build only if primary feature is complete and time permits.

### 3.1 What Web Monetisation Is

Web Monetisation is a browser API that streams micropayments from a user's wallet to a receiver's wallet address declared in the page's `<link rel="monetization">` tag. OpenRemit already has a full working implementation of this in its "The Ledger" news demo (`backend/src/routes/news.ts`, `frontend/src/views/newsView.ts`, `frontend/src/views/newsArticleView.ts`).

### 3.2 Options for Stride

This is an **open decision** for the team. Two approaches:

**Option A — Reuse OpenRemit's news demo as-is**
Rename "The Ledger" to something Stride-branded. Seed articles relevant to informal workers, stokvels, or financial literacy. Lowest effort — backend is already built.

**Option B — Stride-specific Web Monetisation hook**
Use the Web Monetisation stream to unlock a premium payslip template or a worker's public profile page. A visitor with the WM extension and a funded testnet wallet streams a small payment to unlock the full view; without the extension, an Open Payments fallback (one-off payment via the normal GNAP flow) is offered. Backend pattern is identical to OpenRemit's `wm-unlock` / `unlock` routes.

### 3.3 What Already Exists in OpenRemit (Do Not Rebuild)

| Existing route | What it does |
|----------------|--------------|
| `GET /api/news/posts` | List articles with per-reader `unlocked` flag |
| `GET /api/news/posts/:id` | Single article; body returned when unlocked |
| `POST /api/news/posts/:id/wm-unlock` | Records a WM browser payment and marks as unlocked |
| `POST /api/news/posts/:id/unlock` | Fallback: returns a `QuoteResponse` for the normal GNAP flow |
| `backend/src/lib/seedNews.ts` | Seeds demo articles on first boot |

If going with Option A, only content changes (article copy, branding) are needed — no backend code changes.

### 3.4 Browser Requirement

Real Web Monetisation requires the [Web Monetisation browser extension](https://webmonetization.org/) with a funded testnet wallet. Without it, articles/content show a notice and offer the Open Payments one-off fallback. This is already handled in OpenRemit's implementation — nothing breaks for users without the extension.

---

## 4. Open Decisions

These need a team decision before the relevant code is written.

| # | Decision | Options | Impact |
|---|----------|---------|--------|
| 1 | **Payslip share format** | (a) Screenshot-friendly in-app view only; (b) shareable public URL accessible without login; (c) PDF download | Option (b) requires a public `GET /api/payslip/:id` route with no auth guard and a separate public-facing React view. Option (c) requires a PDF generation library (e.g. `html2canvas` + `jsPDF` client-side, or `puppeteer` server-side — adds complexity). Option (a) is zero extra work and enough for the demo. | 
| 2 | **Web Monetisation theme** | (a) Reuse OpenRemit's news/Ledger demo; (b) Stride-specific unlock (payslip template or worker profile) | Option (a) is ~30 minutes of work. Option (b) is ~3–4 hours. Only relevant if primary feature ships with time to spare. |

---

## 5. Out of Scope

The following features are described in the Stride pitch but are **not being built for this hackathon**:

- Stokvel group management (stokvels / stokvel_members tables, contribution requests, payout flow)
- Cross-border remittance UI (currency/country selector on quote view)
- Worker QR code for employer payments
- Credit score data pathway (TransUnion / Experian)
- Worker public profile page

These remain in the pitch as the broader vision but will not appear in the demo or the codebase.

---

## 6. TestNet Setup

Each team member demoing a payment needs:

1. An account at [wallet.interledger-test.dev](https://wallet.interledger-test.dev)
2. At least two wallet addresses (one for "employer", one for "Nomsa")
3. A generated key pair uploaded under **Settings → Developer Keys → Add Key**
4. `backend/.env` configured:

```env
OP_WALLET_ADDRESS=https://ilp.interledger-test.dev/your-address
OP_KEY_ID=your-key-uuid
OP_PRIVATE_KEY_PATH=./private.key
```

---

## 7. Day-by-Day Plan

### Day 1 — Backend complete, demo flow unblocked

- [ ] Fork OpenRemit, confirm `npm run dev` starts clean
- [ ] Add `description` validation to `POST /api/remit/quote`
- [ ] Extend `GET /api/remit/history` to include received payments + `type` field
- [ ] Add `GET /api/remit/history/:id` route
- [ ] Wire new route in `backend/src/index.ts`
- [ ] Add typed wrapper in `frontend/src/api.ts`
- [ ] Test full payment flow end-to-end on TestNet (employer pays → transaction appears in Nomsa's history)
- [ ] **Decision:** resolve Open Decision #1 (payslip share format) by end of day

### Day 2 — Frontend polished, demo-ready

- [ ] Build `IncomeHistoryView.tsx` (list + date filter)
- [ ] Build `PayslipView.tsx` (formatted payslip)
- [ ] Wire both views into the router
- [ ] Add description field (required) to quote form
- [ ] Full scripted demo run-through (Nomsa's payslip in under 2 minutes)
- [ ] If time: resolve Open Decision #2 and implement Web Monetisation stretch feature
