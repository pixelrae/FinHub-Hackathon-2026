# Stride — Financial Infrastructure for the Informal Economy

> Built at the 2026 UCT Interledger Bootcamp & Hackathon, Cape Town
> Powered by Open Payments · Interledger Protocol · Built on OpenRemit

---

## Tagline

> **"Your money, with proof."**

Stride is not just a payment app. It is a **financial identity tool** for people the formal system has never seen.

---

## The Problem

South Africa has one of the largest informal economies in the world. Domestic workers, day labourers, spaza shop employees, and seasonal workers make up millions of working people — yet the financial system largely ignores them.

### Three Painful Problems

**1. No Proof of Income**
Most informal workers are paid in cash. There is no payslip, no bank record, no document they can show a landlord, a bank, or a credit provider. Without proof of income, they cannot rent a formal property, qualify for a loan, or access basic financial products. They are **financially invisible** despite working full time.

**2. Stokvels Are Manual and Trust-Dependent**
Stokvels are a cornerstone of South African savings culture — an estimated **11 million people** participate, saving over **R50 billion annually**. But almost all stokvels run on cash and verbal agreements. The treasurer holds the money. Disputes are common. Fraud happens. There is no transparent record of who contributed what and when.

**3. Cross-Border Money Transfer Is Exploitative**
Millions of SADC migrants — from Zimbabwe, Mozambique, Lesotho, and beyond — work in South Africa and send money home. Services like Mukuru and Western Union charge between **5% and 12% per transaction**. A worker sending R1,000 home loses up to R120 in fees alone. Every month.

### The Root Cause

All three problems share a single underlying cause: there is no open, interoperable financial infrastructure that works for people outside the formal banking system. Money moves through **closed, expensive, proprietary networks** that were never designed for them.

---

## The Solution

Stride gives every user a **single, portable wallet address** — and builds three financial tools around it.

| Feature | What It Does |
|---|---|
| **Pay** — Digital Payslips | Employers pay workers through Stride; every completed payment automatically becomes a verifiable digital payslip |
| **Save** — Digital Stokvels | A transparent stokvel manager where contributions and payouts are recorded on-chain, eliminating fraud and trust disputes |
| **Send** — Cross-Border Remittances | Affordable money transfers across SADC corridors at near-zero fees |

The central insight: **the same wallet address powers all three features.** Nomsa, a domestic worker in Johannesburg, receives her Friday pay via Stride — that transaction becomes her payslip. She contributes to a stokvel with her neighbours through Stride — contributions and payouts are transparent. When she sends money to her mother in Harare — the same app handles it, because Open Payments works across borders and currencies by design.

---

## Feature Deep-Dives

### Feature 1: Digital Payslips & Proof of Income

**What it does:**
Every completed payment in Stride generates a formal, shareable digital payslip. The employer pays through the app; the worker receives a document showing employer name, worker name, amount, date, work description, and a unique transaction ID anchored to the Open Payments record.

**Why it matters:**
A Stride payslip is not self-generated. It is backed by an immutable Open Payments transaction record that any third party — a landlord, a bank, a credit provider — can verify. This is the difference between a document someone typed in Word and a **financial credential**.

**What it requires technically:**
Almost no new backend code. OpenRemit's transaction history already captures sender, receiver, amount, date, and description. Stride makes the description field mandatory for employer payments and adds a new frontend view that renders the transaction as a formatted payslip. The proof of income is the payment itself.

**Data captured per transaction:**
- Sender wallet address (employer identity)
- Receiver wallet address (worker identity)
- Amount and currency
- Timestamp
- Unique transaction ID
- Work description (mandatory field)

---

### Feature 2: Digital Stokvels

**What it does:**
A treasurer creates a stokvel group, adds members by their wallet address or username, and sets the monthly contribution amount and payout schedule. At payout time, Stride sends contribution requests to all members simultaneously. Each member approves through the standard Open Payments consent flow. When all contributions are collected, the treasurer triggers the payout to that month's nominated recipient. Every transaction is recorded and visible to all group members.

**Why it matters:**
The trust problem at the heart of every stokvel dispute is eliminated. There is no single person holding cash. There are no verbal agreements. There is a transparent, auditable ledger every member can see — and no treasurer can falsify.

**Technical approach:**
Extends OpenRemit's database with two new tables:
- `stokvels` — group name, member list, contribution amount, payout schedule
- `stokvel_members` — userId, stokveldId, contribution amount, payout order

Reuses OpenRemit's existing payment request ("ask") flow to send contribution requests to all members simultaneously. The payout is a standard outgoing Open Payments payment.

**Stokvel Dashboard view shows:**
- All members and their contribution status
- Payout order and next recipient
- Full audit trail of every contribution and payout

---

### Feature 3: Cross-Border Remittances

**What it does:**
Nomsa opens Stride, enters her mother's mobile money wallet address in Zimbabwe, and sees the quote: R300 → approximately $16.20 after exchange, near-zero markup, minimal network fee — before she confirms. She approves. The money arrives the same day.

**Why it matters:**
ILP's multi-hop routing handles currency conversion across the network at the protocol level — not through a proprietary FX desk. This removes the structural cost that makes Mukuru and Western Union expensive. The fee savings compound every month for every corridor worker.

**Comparison:**

| Service | Fee on R1,000 |
|---|---|
| Western Union | Up to R120 (12%) |
| Mukuru | R50–R80 (5–8%) |
| Stride (ILP) | Near-zero network fee |

**Technical approach:**
OpenRemit was built as a remittance template. Stride adds a country and currency selector to the quote view, surfaces the exchange rate clearly, and shows the recipient amount in their local currency before confirmation. ILP handles the rest.

---

### Feature 4: Financial Identity & Credit Building *(the bigger vision)*

**The insight:**
A credit score answers one question: can this person be trusted to repay? Traditional bureaus answer it using bank statements and credit history. Informal workers have none of that — but Stride's transaction history can answer the same question differently.

**What Stride's transaction record can show:**
- **Income regularity** — does the same employer wallet pay this worker every Friday?
- **Income stability** — is the amount consistent over 3, 6, 12 months?
- **Savings behaviour** — does the worker make stokvel contributions reliably and on time?
- **Employer tenure** — how long has this employment relationship existed on-chain?

**Why this is different from existing alternative credit scoring:**
Most alternative scoring uses mobile airtime top-ups or self-reported income — a lender has to take it on trust. A Stride payslip is backed by an Open Payments transaction record with a unique ID that any party can verify. The employer didn't just *say* they paid Nomsa — **the payment happened, and the record is immutable.** That is the difference between a self-generated document and a financial credential.

**The pathway:**
In South Africa, TransUnion and Experian accept alternative data. There is a formal pathway to submitting non-bank financial records as inputs to a credit score. Stride's transaction history is structured exactly for this.

**What a worker builds over time:**
- A verifiable employment history
- A savings track record
- A cross-border transfer record
- The foundation for accessing credit, housing, and formal financial services — for the first time

---

## How Open Payments Powers Everything

Every transaction in Stride — gig payment, stokvel contribution, or remittance — follows the same Open Payments flow:

```
  Stride App               Backend                      Open Payments Network
  ─────────────────────    ──────────────────────────   ──────────────────────
  Enter recipient          POST /api/remit/quote
  + amount + description   ├─ walletAddress.get()       ──► Resolve both wallets
                           ├─ grant.request()           ──► Incoming-payment grant
                           ├─ incomingPayment.create()  ──► Create incoming payment
                           ├─ grant.request()           ──► Quote grant
                           └─ quote.create()            ──► Fees shown upfront

  Sender approves          POST /api/remit/consent
                           ├─ grant.request()           ──► Interactive GNAP grant
                           └─ returns interactUrl

  Wallet auth redirect ──────────────────────────────► Auth server consent screen

  Callback             ──► GET /api/callback
                           ├─ grant.continue()          ──► Exchange interact_ref
                           └─ outgoingPayment.create()  ──► Funds move

  Both parties receive an immutable transaction record
```

This is not a simulation or a wrapper. **Every payment in the demo is a live transaction on the Interledger TestNet.**

---

## Why Stride Beats Existing Solutions

| Dimension | MoMo / Mukuru / Existing | Stride |
|---|---|---|
| **Network** | Closed, proprietary — works only within one operator's ecosystem | Open Payments is interoperable by design — any wallet on the ILP network can transact with any other |
| **Cross-border fees** | 5–12% per transaction | Near-zero — ILP removes the bilateral correspondent banking markup |
| **Proof of income** | No — transactions exist but aren't structured as income records | Yes — every employer payment generates a formal, verifiable digital payslip |
| **Stokvel support** | None — stokvels still run on cash | Native — contribution requests, transparent audit trail, automated payouts |
| **Identity portability** | Tied to a mobile number and operator | Wallet address is operator-agnostic and persistent |
| **Currency conversion** | Proprietary FX desk, opaque rates | ILP handles conversion at the protocol layer; exact rate shown before confirmation |
| **Credit building** | None | Every transaction builds a verifiable financial history |
| **Interoperability** | Requires bilateral commercial agreements | Structural — grows automatically as Open Payments adoption expands across SADC |

---

## The Demo Story: Nomsa's Week

*Nomsa is a domestic worker in Johannesburg. She works five days a week for a family in Sandton. She is in a stokvel with nine other women from her street. Her mother lives in Harare, Zimbabwe.*

**Friday — Pay Day**
Nomsa's employer opens Stride, enters Nomsa's wallet address, adds a description (*"House cleaning, 5 days, June week 4"*), and pays her R800. Nomsa receives a notification and views her digital payslip immediately. She screenshots it and sends it to her landlord who has been asking for proof of income.

**Month End — Stokvel Payout**
The treasurer opens the Stokvel Dashboard, sees all 10 members listed, and clicks "Send contribution requests". Each member receives an Open Payments payment request for R500. Eight members approve immediately. Two are reminded the next day. When all 10 have paid, the treasurer triggers the payout — R5,000 lands in this month's recipient's wallet within seconds, with a full audit trail every member can see.

**Weekend — Remittance**
Nomsa wants to send R300 to her mother in Harare. She opens Stride, enters her mother's mobile money wallet address, and sees the quote: R300 → approximately $16.20 after exchange, near-zero fee. She approves. The money arrives the same day.

> This is one person's week. Multiply it by millions of informal workers across Southern Africa.

---

## Real-World Viability

| Channel | Opportunity |
|---|---|
| **Domestic worker unions** | SADSAWU has 20,000+ members; partnering onboards workers and employers simultaneously |
| **Stokvel associations** | Formal stokvel networks exist in every major South African city and actively seek tools that protect members from treasurer fraud |
| **Remittance corridors** | The Zimbabwe corridor alone represents hundreds of millions of rand annually; competitive fees are a compelling acquisition driver |
| **Structural advantage** | As Open Payments adoption grows across SADC banks and mobile money providers, Stride's interoperability becomes a durable structural moat |

**Revenue model:**
- Small percentage fee on stokvel payouts (far less than the fraud losses the system currently prevents)
- Premium payslip features for employers
- FX margin on cross-border transfers
- Credit score data partnerships with bureaus (TransUnion, Experian)

---

## Technical Foundation

**Built on:** OpenRemit — an open-source hackathon template implementing the complete Open Payments send/receive flow using the `@interledger/open-payments` SDK.

**Stack:**
- Backend: Node.js + Express + Drizzle ORM + SQLite
- Frontend: React + Vite
- Protocol: Open Payments + ILP + GNAP
- TestNet: `wallet.interledger-test.dev`

**Key extensions to OpenRemit:**

| File / Area | Change |
|---|---|
| `backend/src/db/schema.ts` | Add `stokvels` and `stokvel_members` tables |
| `backend/src/routes/` | Add `/api/stokvels` routes |
| `backend/src/routes/remit.ts` | Make `description` mandatory on employer payments |
| `frontend/src/views/payslipView.tsx` | Renders a transaction as a formal digital payslip |
| `frontend/src/views/stokveldashboardView.tsx` | Group dashboard with audit trail |
| `frontend/src/views/quoteView.tsx` | Currency/country selector for cross-border payments |

---

## Hackathon Rubric Alignment

| Category | Why Stride Delivers |
|---|---|
| **Quality of the idea** | Clear, specific problem affecting millions of South Africans. Three features unified by one insight: a wallet address is a financial identity. |
| **Strategic impact** | 11 million stokvel participants, millions of informal workers, millions of SADC migrants — all underserved. Open Payments used throughout every feature. |
| **Implementation** | Built on production-quality OpenRemit template. Live TestNet demo. Payslip requires minimal new code. Stokvel reuses existing payment request flow. |
| **User experience** | Nomsa's story is the demo. Judges see a real person's week, not a generic payment flow. The payslip view delivers tangible proof of value in under 10 seconds. |

---

## Team

| Name | Role |
|---|---|
| Amy Felix | — |
| Nicoroy Zwane | — |
| Nina Meyer | — |
| Azrah Parker | — |
| Zaakirah Levy | — |
| Bonolo Masela | — |

---

*Built at the 2026 UCT Interledger Bootcamp & Hackathon, Cape Town.*
*Template: [OpenRemit](https://github.com/marclevin/OpenRemit) · Protocol: [Open Payments](https://openpayments.dev) · Network: [Interledger](https://interledger.org)*
