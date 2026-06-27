# Stride

> Financial inclusion platform for informal workers across Southern Africa.
> Built on the **Interledger Protocol (ILP)** and **Open Payments**.
> Developed for the **UCT × Interledger Fintech Hackathon 2026**.

---

## Overview

Stride enables domestic workers, day labourers, and gig workers to:

* Receive secure digital payments
* Automatically generate verifiable proof of income
* Build a portable financial history
* Access loans, housing, and financial services without requiring a traditional bank account

Every user receives an Interledger wallet address that works across banks, mobile money providers, and digital wallets.

---

## The Problem

Millions of informal workers in South Africa are paid in cash. Without verifiable income records or payslips, they often cannot:

* Rent formal housing
* Qualify for loans or credit
* Access basic financial services

In addition, manual stokvels and expensive remittance services expose workers to:

* Fraud
* Poor transparency
* High transaction costs

---

## The Solution

Stride combines three core tools into one platform.

| Feature              | Description                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------- |
| **Digital Payslips** | Every completed payment automatically becomes verifiable proof of income                    |
| **QR Payments**      | Workers generate a QR code that employers can scan and pay without needing a Stride account |
| **Income Reports**   | Signed PDF reports of received payments that can be verified by lenders and landlords       |

---

## How It Works

Every payment follows the Open Payments flow:

1. Sender and receiver both have Interledger wallet addresses.
2. The app requests a grant to create an incoming payment on the receiver's account.
3. A quote is generated showing the exact amount and fees upfront.
4. The sender approves the payment via a GNAP interactive grant.
5. An outgoing payment is created and funds move directly between accounts.
6. Both parties receive an immutable transaction record.

---

## Tech Stack

### Frontend

* React
* Vite
* React Router
* Plain CSS (mobile-first)

### Backend

* Node.js
* Express
* Drizzle ORM
* SQLite
* `@interledger/open-payments`
* PDFKit
* `qrcode`

### Standards

* Open Payments (OP)
* Interledger Protocol (ILP)
* GNAP (Grant Negotiation and Authorization Protocol)

### Base Template

* [OpenRemit](https://github.com/marclevin/OpenRemit) — Open Payments hackathon launchpad

---

## Repository Structure

```text
stride/
├── stride-frontend/
│   └── src/
│       ├── api/
│       │   └── index.js
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
└── stride-backend/
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

* Node.js 20+
* An account at https://wallet.interledger-test.dev
* Two wallet addresses (worker and employer)
* A generated key pair uploaded under **Settings → Developer Keys**

---

## Installation

### 1. Clone the repository

```bash
git clone git clone git@github.com:pixelrae/Stride.git
cd stride
```

### 2. Install backend dependencies

```bash
cd stride-backend/backend
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
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

### 4. Push the database schema

```bash
npm run db:push
```

### 5. Install frontend dependencies

```bash
cd ../../stride-frontend
npm install
```

---

## Running the Application

Open two terminals.

### Terminal 1 — Backend

```bash
cd stride-backend/backend
npm run dev
```

Expected output:

```text
Stride backend → http://localhost:3001
```

### Terminal 2 — Frontend

```bash
cd stride-frontend
npm run dev
```

Expected output:

```text
Local: http://localhost:5173
```

Open:

```text
http://localhost:5173
```

---

## Demo Accounts

You can create demo accounts through the signup page or via PowerShell:

```powershell
# Worker account
Invoke-WebRequest `
  -Uri "http://localhost:3001/api/auth/signup" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"nomsa@stride.com","password":"password123","displayName":"Nomsa Dlamini"}'

# Employer account
Invoke-WebRequest `
  -Uri "http://localhost:3001/api/auth/signup" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"employer@stride.com","password":"password123","displayName":"Sarah Johnson"}'
```

---

## Demo Flow

### 1. Worker Generates QR Code

1. Log in as **Nomsa**
2. Navigate to **My QR Code**
3. Click **Generate My QR Code**
4. Display or download the QR code

### 2. Employer Pays via QR

1. Scan the QR code or open:

```text
http://localhost:3001/pay/nomsa-dlamini
```

2. Enter:

   * Name
   * Wallet address
   * Amount
   * Work description
3. Click **Pay Now**
4. Approve the payment in the Interledger test wallet.
5. Payment confirmation is displayed.

### 3. Worker Views Payslip

1. Log in as **Nomsa**
2. Navigate to **Income History**
3. Select **View**
4. Review the generated payslip and transaction details.

### 4. Download Proof of Income

1. Navigate to **Income Report**
2. Select a date range
3. Click **Download PDF Report**
4. The report is generated with an HMAC signature.
5. Lenders can verify authenticity via the verification URL.

---

## Using QR Codes on Real Devices

Expose the backend using ngrok:

```bash
ngrok http 3001
```

Update `backend/.env`:

```env
BACKEND_URL=https://abc123.ngrok-free.app
```

Restart the backend and regenerate the QR code.

> **Note:** Free ngrok URLs change after every restart, so QR codes must be regenerated.

---

## API Endpoints

### Authentication

| Method | Route              | Description                       |
| ------ | ------------------ | --------------------------------- |
| POST   | `/api/auth/signup` | Create account                    |
| POST   | `/api/auth/login`  | Login and return JWT              |
| GET    | `/api/auth/me`     | Get current user                  |
| PATCH  | `/api/auth/me`     | Update profile and wallet address |

### Payments

| Method | Route                   | Description                       |
| ------ | ----------------------- | --------------------------------- |
| POST   | `/api/remit/quote`      | Create payment quote              |
| POST   | `/api/remit/consent`    | Request GNAP interactive grant    |
| GET    | `/api/remit/status/:id` | Poll transaction status           |
| GET    | `/api/remit/history`    | Sent and received payment history |
| GET    | `/api/callback`         | GNAP redirect handler             |

### QR

| Method | Route              | Description                  |
| ------ | ------------------ | ---------------------------- |
| POST   | `/api/qr/generate` | Generate worker QR code      |
| GET    | `/api/qr/download` | Download QR PNG              |
| GET    | `/pay/:handle`     | Public employer payment page |
| POST   | `/pay/:handle`     | Submit employer payment      |

### Reports

| Method | Route                  | Description              |
| ------ | ---------------------- | ------------------------ |
| GET    | `/api/report/generate` | Stream signed PDF report |
| GET    | `/api/report/verify`   | Verify report signature  |

---

## Key Design Decisions

### Employer Requires No Stride Account

The QR code contains a standard HTTPS URL. Any smartphone camera can open the payment page, and Stride orchestrates the Open Payments flow.

### No Balance Exposure

Stride never stores or accesses wallet balances. Wallet providers retain full custody and privacy.

### Tamper-Evident Reports

PDF reports are signed with HMAC-SHA256 and can be independently verified without contacting Stride.

### One Wallet Address for Everything

A single wallet address powers:

* Incoming payments
* QR payments
* Financial history
* Portable identity across providers

---

## Environment Variables

| Variable              | Description                |
| --------------------- | -------------------------- |
| `PORT`                | Backend port               |
| `BACKEND_URL`         | Public backend URL         |
| `FRONTEND_URL`        | Frontend URL               |
| `OP_WALLET_ADDRESS`   | Interledger wallet address |
| `OP_KEY_ID`           | Uploaded key UUID          |
| `OP_PRIVATE_KEY_PATH` | Path to private key        |
| `DB_PATH`             | SQLite database path       |
| `JWT_SECRET`          | JWT signing secret         |
| `REPORT_SECRET`       | HMAC signing secret        |

---

## Built With

* Interledger Protocol
* Open Payments
* OpenRemit
* Interledger Test Wallet

---

<p align="center">
  <strong>Stride</strong><br>
  UCT × Interledger Fintech Hackathon 2026<br>
  Built on Open Payments
</p>
