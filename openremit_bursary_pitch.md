# BursaryPay — Programmable Spending for South African Bursary Students

> **2026 UCT Interledger Hackathon**
> Built on [OpenRemit](https://github.com/marclevin/OpenRemit) · Powered by Open Payments

---

## The Problem

Thousands of South African university students receive a stationery and textbook allowance through bursary sponsors like StudyTrust. Today, that allowance can only be spent at Van Schaik — a single national chain with limited branches, frequent stock-outs of prescribed textbooks, and a narrow stationery range.

When a student cannot find what they need at Van Schaik, the process to buy it elsewhere looks like this:

1. Email the bursary officer with the item name, the store, and the branch
2. Wait for manual approval
3. Wait for the sponsor to pay the store directly, or pay out of pocket and submit a receipt for reimbursement
4. Collect the item days later

This is not an edge case. It happens routinely, every semester, for every student who needs a title Van Schaik does not stock or cannot supply in time. Bursary officers spend meaningful hours each week processing requests that should not require human intervention at all.

---

## The Van Schaik Contract — What We Are Not Doing

StudyTrust may hold a preferential supply agreement with Van Schaik. **We are not proposing to replace that relationship.**

Van Schaik remains the primary, preferred merchant. BursaryPay is a controlled overflow layer: when Van Schaik cannot fulfil a student's need, a pre-approved secondary merchant list is unlocked — subject to the same item-category rules the sponsor already enforces. The sponsor configures the rules once. Van Schaik's contract is not threatened because they remain first in the hierarchy.

This is an augmentation, not a disruption.

---

## The Solution

A lightweight Open Payments-based conditional spending layer that sits between the sponsor's disbursement and the merchant's till.

### How It Works

**Step 1 — Sponsor loads a scoped wallet**
The bursary officer logs into the sponsor dashboard and funds a student's Open Payments wallet with the stationery allowance — for example, R2,000. The grant is scoped by spending category (`textbooks`, `stationery`) and tied to an approved merchant list. Van Schaik is always on that list. Secondary merchants are added at the sponsor's discretion.

**Step 2 — Student shops**
The student arrives at any approved store. At checkout, they open the BursaryPay app, enter the basket total, and generate a QR code. No card. No cash. No email.

**Step 3 — Merchant scans**
The cashier scans the QR. This triggers an Open Payments outgoing payment request against the student's wallet. Before the payment proceeds, a pre-flight check runs silently:

- Is this merchant's wallet address on the sponsor's approved list?
- Does the category tag on the request match the student's grant scope?
- Does the basket total fall within the student's remaining balance?

If all three pass, the payment completes instantly. If not, it is declined with a clear reason.

**Step 4 — Automatic audit trail**
Every transaction is logged against the student's account with merchant, amount, category, and timestamp. The sponsor dashboard updates in real time. No receipt scanning. No email thread. No manual reconciliation.

---

## Open Payments Flow

```
  Student App              BursaryPay Backend           Open Payments Network
  ─────────────────────    ──────────────────────────   ──────────────────────
  Generate QR              POST /api/remit/quote
  (wallet + amount)        ├─ Merchant pre-flight check  ──► Verify merchant on
                           │   (approved list + category)     approved list
                           ├─ walletAddress.get()        ──► Resolve both wallets
                           ├─ grant.request()            ──► Incoming-payment grant
                           ├─ incomingPayment.create()   ──► Create incoming payment
                           ├─ grant.request()            ──► Quote grant
                           └─ quote.create()             ──► Get quote & fee

  Confirm payment          POST /api/remit/consent
                           ├─ grant.request()            ──► Interactive outgoing grant
                           └─ returns interactUrl

  Wallet auth redirect ───────────────────────────────► Auth server consent screen

  Callback             ──► GET /api/callback
                           ├─ grant.continue()           ──► Exchange interact_ref
                           ├─ outgoingPayment.create()   ──► Execute payment
                           └─ balance updated in DB

  Sponsor dashboard        GET /api/sponsor/dashboard
                           └─ Real-time transaction log
```

---

## What We Build On — OpenRemit

OpenRemit provides the complete Open Payments send flow out of the box: wallet resolution, grant request, quote, interactive outgoing payment consent, and callback handling. The database schema supports users and transactions. That is approximately 60% of what BursaryPay needs.

### Changes to OpenRemit

| File / Area | Change |
|---|---|
| `backend/src/lib/quoteFlow.ts` | Insert merchant pre-flight check and category tag validation before the quote is created |
| `backend/src/db/schema.ts` | Add `sponsor_grants` table (studentId, merchantWalletAddresses, categories, amountCap, amountRemaining) and `merchants` table |
| `backend/src/routes/remit.ts` | Accept a `category` field on `/api/remit/quote` and thread it through the pre-flight check |
| `backend/src/routes/` | Add `/api/sponsor/fund` to load a student wallet with a scoped grant, and `/api/sponsor/dashboard` for transaction overview |
| `frontend/src/views/merchantView.ts` | New view: QR code generation for the merchant-facing checkout screen |
| `frontend/src/views/sponsorView.ts` | New view: sponsor dashboard showing student spend by category, merchant, and date |

The core quote → consent → callback pipeline in OpenRemit is **unchanged**. The pre-flight check is a single async function inserted at the top of `quoteFlow.ts` that either passes through or throws a typed error before the SDK is invoked.

---

## Prototype Demo Script

> Runtime: under 3 minutes

1. **Sponsor view** — The bursary officer loads R2,000 into a student wallet scoped to `textbooks` and `stationery`. Approved merchants: Van Schaik (primary) and Takealot Education (secondary).

2. **Student view** — The student logs in, sees their R2,000 balance and the approved merchant list. They navigate to checkout, enter R450 for a prescribed textbook, and generate a QR code.

3. **Merchant scan** — The cashier scans the QR on the merchant view screen. The backend runs the pre-flight check (Takealot Education is approved, category is `textbooks`, R450 is within balance), runs the quote flow, and completes the outgoing payment.

4. **Result** — Student balance drops to R1,550. Sponsor dashboard updates in real time. Transaction shows merchant, amount, category, and timestamp. No email was sent. No approval was required.

---

## Addressing the Rubric

### Quality of the Idea
The problem is precisely defined, affects a known and sizable population, and the solution addresses it without disrupting existing sponsor contracts. The approved merchant list and category scoping are not cosmetic — they are the enforcement mechanism that makes this safe for sponsors to adopt.

### Potential Strategic Impact
The architecture is sponsor-agnostic and merchant-agnostic. The same implementation applies directly to:

- **Other corporate bursary programmes** — Investec, Anglo American, and similar CSI schemes with the same manual approval friction
- **NSFAS disbursements** — where funds are frequently misused; grant-scoped wallets enforce purpose by construction, not audit
- **School uniform and meal allowances** — parent or NGO loads a child's wallet scoped to a school tuck shop or approved clothing retailer
- **Employee expense accounts** — training budgets restricted to approved course providers, meal allowances restricted to specific restaurant groups
- **Humanitarian aid disbursements** — NGO wallets scoped to approved food or medicine suppliers, replacing costly voucher schemes

In every case: funded wallet, scoped grant, approved merchant list, category enforcement, automatic audit trail.

---

## Beyond Bursaries — A Primitive for Public Financial Integrity

The architecture underpinning BursaryPay — funded wallet, scoped grant, approved merchant list,
category enforcement, immutable audit trail — is not specific to student allowances. Pointed at
public finance, it becomes an anti-corruption primitive.

### The Core Insight

Current disbursement systems separate custody from control. When a government department, NGO, or
sponsor releases funds, they surrender custody and rely on policy, audit, and recipient honesty to
ensure the money is used correctly. The lag between disbursement and verification is precisely where
corruption, laundering, and misuse occur.

A grant-scoped Open Payments wallet closes that gap. Control remains with the issuer even after
custody passes to the recipient. The funds exist in the recipient's wallet — but they can only move
along paths the issuer has pre-authorised. This is not surveillance. It is programmable trust: the
payment layer enforces the agreement so that humans do not have to.

---

### Tender Fraud & Corruption

South African government tenders are routinely awarded to connected parties who invoice for goods
and services never rendered. The money leaves the fiscus and lands in a general account with no
programmatic constraint on how it is spent.

If tender disbursements were issued as Open Payments grants scoped to approved supplier wallet
addresses, payment to an unapproved party becomes impossible by construction — not by policy, not
by after-the-fact audit, but by the payment layer itself. A municipality awarding a road
construction tender could scope the grant to registered materials suppliers, plant hire companies,
and subcontractors. Payment to a shell company not on that list would not execute. Any change to
the approved list creates an auditable record of who authorised it and when — a chain of custody
that does not exist in current tender administration.

---

### Money Laundering

Laundering depends on obscuring the origin and purpose of funds as they move between accounts. A
grant-scoped Open Payments wallet is structurally opposed to this: every transaction carries a
category tag, a merchant identifier, an amount, and a timestamp, recorded as a byproduct of the
payment flow itself. There is no gap between the transaction and the record of the transaction. For
a compliance officer or investigator, this is the difference between reconstructing what happened
and simply reading what happened.

---

### Misuse of Social Grants & NGO Disbursements

NSFAS, municipal social grants, and NGO disbursements share the same failure mode: money reaches a
beneficiary's general account and is spent on anything. The intended purpose is enforced only by
policy and recipient honesty, with reconciliation occurring weeks or months later if at all.

Grant-scoped wallets enforce purpose at the moment of payment. A social grant scoped to food
retailers cannot be spent at a liquor store. An NGO medical supply grant scoped to approved
pharmacies cannot be redirected to a connected intermediary. The constraint is not a rule someone
can choose to ignore — it is the condition under which the payment authorises at all.

---

### Use Case Summary

| Context | Issuer | Approved Scope | Problem Solved |
|---|---|---|---|
| University bursary | StudyTrust / corporate sponsor | Approved textbook & stationery merchants | Manual approval process, merchant lock-in |
| Government tender | Municipal / national department | Registered supplier wallet addresses | Shell company payments, invoice fraud |
| Social grant | SASSA / municipality | Food retailers, pharmacies, utilities | Fund misuse, no audit trail |
| NGO aid disbursement | Aid organisation | Approved grocery & medical suppliers | Voucher fraud, intermediary capture |
| School tuck shop | Parent body / school fund | Single tuck shop wallet | Cash misuse, no spend visibility |
| Corporate expense account | Employer | Approved vendors by category | Policy violations, manual reconciliation |

In every case the implementation is identical. Only the sponsor configuration changes. BursaryPay
is the first and simplest instance of a general-purpose conditional spending infrastructure with a
viable pathway into public finance reform.

---

### Implementation
Open Payments is the core payment primitive, not a wrapper. The grant `limits` field encodes the spending contract. The pre-flight check enforces it before the SDK flow runs. The changes to OpenRemit are surgical and scoped — four new routes, two new DB tables, two new frontend views, and one validation function in `quoteFlow.ts`.

### User Experience
Three distinct users, each with a minimal flow:
- **Sponsor:** configure once, monitor always
- **Student:** open app, generate QR, done
- **Merchant:** scan code, receive payment, continue

No email. No receipt. No waiting.

---

## Stretch Goal

If the core prototype is stable by Friday, the stretch goal is **dynamic merchant unlock**: a student requests that an out-of-network merchant be added; the sponsor approves it in one tap on the dashboard; that merchant is immediately added to the student's approved list for that transaction only. This keeps the sponsor in control while eliminating even the residual friction for genuinely exceptional purchases.

Beyond the hackathon: package the sponsor configuration layer as a white-label API that any South African bursary programme — NSFAS, corporate CSI, NGO — can integrate without touching the underlying Open Payments implementation.

---

## The Ask

This is a real problem affecting tens of thousands of South African students right now. The infrastructure to solve it exists — Open Payments provides the programmable grant layer, OpenRemit provides the implementation scaffold, and the merchant QR flow is a thin layer on top.

The goal after this hackathon is a pilot with one sponsor, two approved merchants, and twenty students in the first semester of 2027.

---

*Built at the 2026 UCT Interledger Bootcamp & Hackathon, Cape Town.*
*Template: [OpenRemit](https://github.com/marclevin/OpenRemit) · Protocol: [Open Payments](https://openpayments.dev)*
