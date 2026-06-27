```markdown
# Stride — Financial Inclusion Platform

> Built on the Interledger Protocol and Open Payments standard.
> Hackathon project — UCT × Interledger Fintech Hackathon 2026.

---

## What is Stride?

Stride is a financial inclusion platform for informal workers across Southern Africa. It enables domestic workers, day labourers, and gig workers to receive secure digital payments, automatically generate verifiable proof of income, and build a financial history that can be used to access loans, housing, and financial services.

Built on the **Interledger Protocol** and the **Open Payments** standard, Stride gives every user a portable wallet address that works across banks, mobile money providers, and digital wallets — no traditional bank account required.

---

## The Problem

Millions of informal workers in South Africa are paid in cash. Without a payslip or verifiable income record they cannot:
- Rent formal housing
- Qualify for a loan or credit
- Access basic financial services

Manual stokvels and expensive cross-border remittance services expose workers to fraud, poor transparency, and high transaction costs.

---

## The Solution

Stride combines three tools into one platform:

| Feature | Description |
|---|---|
| **Digital Payslips** | Every completed payment automatically becomes a verifiable proof of income |
| **QR Payment** | Workers generate a QR code — employers scan and pay with no Stride account needed |
| **Income Report** | Signed PDF report of all received payments, verifiable by lenders and landlords |

---

## How It Works

Every payment in Stride follows the Open Payments flow:

1. Sender and receiver both have Interledger wallet addresses
2. App requests a grant to create an incoming payment on the receiver's account
3. A quote is generated showing the exact amount and fees upfront
4. Sender approves via a GNAP interactive grant
5. Outgoing payment is created and funds move directly between accounts
6. Both parties receive an immutable transaction record

---

## Tech Stack

**Frontend**
- React + Vite
- Plain CSS (mobile-first)
- React Router

**Backend**
- Node.js + Express
- Drizzle ORM + SQLite
- @interledger/open-payments SDK
- PDFKit (report generation)
- qrcode (QR PNG generation)

**Standards**
- Open Payments (OP)
- Interledger Protocol (ILP)
- GNAP (Grant Negotiation and Authorization Protocol)

**Base template**
- [OpenRemit](https://github.com/marclevin/OpenRemit) — Open Payments hackathon launchpad

---

## Repository Structure

```
stride/
├── stride-frontend/        ← React + Vite frontend
│   └── src/
│       ├── api/
│       │   └── index.js    ← All API calls (swap mocks for real here)
│       ├── components/
│       │   └── ProtectedRoute.jsx
│       └── screens/
│           ├── Login.jsx
│           ├── Signup.jsx
│           ├── Home.jsx
│           ├── IncomeHistory.jsx
│           ├── Payslip.jsx
│           ├── SendPayment.jsx
│           ├── PaymentStatus.jsx
│           ├── QRCode.jsx
│           ├── Report.jsx
│           └── SentHistory.jsx
│
└── stride-backend/         ← Node.js + Express backend (forked from OpenRemit)
    └── backend/
        └── src/
            ├── routes/
            │   ├── auth.ts
            │   ├── remit.ts
            │   ├── callback.ts
            │   ├── qr.ts
            │   ├── pay.ts
            │   └── report.ts
            ├── lib/
            │   ├── openPayments.ts
            │   ├── quoteFlow.ts
            │   ├── qrGenerator.ts
            │   └── reportBuilder.ts
            └── db/
                └── schema.ts
```

---

## Prerequisites

- Node.js 20+
- An account at [wallet.interledger-test.dev](https://wallet.interledger-test.dev)
- Two wallet addresses (one for worker, one for employer)
- A generated key pair uploaded under Settings → Developer Keys

---

## Setup & Installation

**Step 1 — Clone the repo:**
```bash
git clone <your-repo-url>
cd stride
```

**Step 2 — Install backend dependencies:**
```bash
cd stride-backend/backend
npm install
```

**Step 3 — Configure environment variables:**
```bash
cp .env.example .env
```

Edit `backend/.env`:
```
PORT=3001
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173
OP_WALLET_ADDRESS=https://ilp.interledger-test.dev/YOUR_HANDLE
OP_KEY_ID=your-key-uuid
OP_PRIVATE_KEY_PATH=./your_key.key
DB_PATH=./openremit.db
JWT_SECRET=your-secret
REPORT_SECRET=your-report-secret
```

**Step 4 — Push the database schema:**
```bash
npm run db:push
```

**Step 5 — Install frontend dependencies:**
```bash
cd ../../stride-frontend
npm install
```

---

## Running the App

You need two terminals open at all times.

**Terminal 1 — Backend:**
```bash
cd stride-backend/backend
npm run dev
```
Wait for:
```
Stride backend → http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd stride-frontend
npm run dev
```
Wait for:
```
Local: http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173)

---

## Demo Accounts

After first run, create accounts via the signup screen or via PowerShell:

```powershell
# Worker account
Invoke-WebRequest -Uri "http://localhost:3001/api/auth/signup" -Method POST -ContentType "application/json" -Body '{"email":"nomsa@stride.com","password":"password123","displayName":"Nomsa Dlamini"}' -UseBasicParsing

# Employer account
Invoke-WebRequest -Uri "http://localhost:3001/api/auth/signup" -Method POST -ContentType "application/json" -Body '{"email":"employer@stride.com","password":"password123","displayName":"Sarah Johnson"}' -UseBasicParsing
```

---

## Demo Script

### Step 1 — Worker generates QR code
1. Log in as Nomsa
2. Go to **My QR Code**
3. Click **Generate My QR Code**
4. Download or display the QR

### Step 2 — Employer pays via QR
1. Scan QR with phone camera (or open `http://localhost:3001/pay/nomsa-dlamini`)
2. Enter name, wallet address, amount, and work description
3. Click **Pay Now**
4. Approve at the Interledger test wallet consent screen
5. Payment complete screen shows on phone

### Step 3 — Worker sees payslip
1. Log in as Nomsa
2. Go to **Income History**
3. Click **View →** on any payment
4. Payslip shows employer, worker, amount, description, and transaction ID verified on the Interledger Network

### Step 4 — Worker downloads proof of income
1. Go to **Income Report**
2. Select a date range
3. Click **Download PDF Report**
4. PDF shows all payments with HMAC signature in footer
5. Lender can verify at the URL in the footer

---

## QR Code on Real Devices (ngrok)

To scan the QR with a real phone:

```bash
ngrok http 3001
```

Copy the ngrok URL (e.g. `https://abc123.ngrok-free.app`) and update `backend/.env`:
```
BACKEND_URL=https://abc123.ngrok-free.app
```

Restart the backend and regenerate the QR code. The QR will now encode a public URL scannable by any phone.

> Note: Free ngrok gives a new URL every restart. Regenerate the QR each time.

---

## API Endpoints

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/me` | Update profile and wallet address |

### Payments
| Method | Route | Description |
|---|---|---|
| POST | `/api/remit/quote` | Create payment quote |
| POST | `/api/remit/consent` | Request GNAP interactive grant |
| GET | `/api/remit/status/:id` | Poll transaction status |
| GET | `/api/remit/history` | Sent and received payment history |
| GET | `/api/callback` | GNAP redirect handler |

### QR
| Method | Route | Description |
|---|---|---|
| POST | `/api/qr/generate` | Generate worker QR code |
| GET | `/api/qr/download` | Download QR PNG |
| GET | `/pay/:handle` | Public employer pay page |
| POST | `/pay/:handle` | Submit employer payment |

### Report
| Method | Route | Description |
|---|---|---|
| GET | `/api/report/generate` | Stream signed PDF report |
| GET | `/api/report/verify` | Verify report HMAC signature |

---

## Key Design Decisions

**Employer needs no Stride account**
The QR code encodes a plain HTTPS URL. Any camera app opens the pay page. The employer enters their wallet address and Stride orchestrates the full GNAP flow on their behalf.

**No balance exposure**
Stride never sees or stores the user's wallet balance. Open Payments only handles payment instructions — balances stay private with the wallet provider.

**Tamper-evident reports**
PDF reports are signed with HMAC-SHA256. Lenders can independently verify authenticity at `/api/report/verify` without contacting Stride.

**One wallet address, everything**
The same wallet address powers incoming payments, QR pay, and the financial history. Portable across providers.

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Backend port (default 3001) |
| `BACKEND_URL` | Public backend URL (use ngrok for demo) |
| `FRONTEND_URL` | Frontend URL for CORS and redirects |
| `OP_WALLET_ADDRESS` | Your Interledger wallet address |
| `OP_KEY_ID` | UUID of your uploaded key pair |
| `OP_PRIVATE_KEY_PATH` | Path to your .key file |
| `DB_PATH` | SQLite database path |
| `JWT_SECRET` | Secret for signing JWTs |
| `REPORT_SECRET` | Secret for HMAC report signing |

---

## Built With

- [Interledger Protocol](https://interledger.org)
- [Open Payments](https://openpayments.dev)
- [OpenRemit](https://github.com/marclevin/OpenRemit) by Marc Levin
- [Interledger Test Wallet](https://wallet.interledger-test.dev)

---

*Stride · UCT × Interledger Fintech Hackathon 2026 · Built on Open Payments*
```
