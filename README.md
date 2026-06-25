# FinTech Hackathon 2026

## Team

**Project:** Stride

### Team Members

- Amy Felix
- Nicoroy Zwane
- Nina Meyer
- Azrah Parker
- Zaakirah Levy
- Bonolo masela

---

# Project Overview

Stride is a financial inclusion platform designed for informal workers across Southern Africa. It enables workers to receive secure digital payments, automatically generate proof of income, manage transparent digital stokvels, and send affordable cross-border remittances.

Built on the Interledger Open Payments standard, Stride provides users with a portable financial identity without requiring a traditional bank account.

---

# Problem Statement

Millions of informal workers are paid in cash, leaving them without verifiable proof of income. This limits access to housing, credit, and financial services while manual stokvels and expensive cross-border remittance services expose users to fraud, poor transparency, and high transaction costs.

---

# Our Solution

Stride combines four financial services into a single platform:

- **Digital Payslips** – Every completed payment automatically becomes verifiable proof of income.
- **Worker Profiles** – Workers can share a digital job card and payment QR code with employers.
- **Digital Stokvels** – Contributions and payouts are securely recorded with complete transparency.
- **Cross-Border Remittances** – Affordable money transfers between South Africa and neighbouring SADC countries.

---

# Open Payments Integration

Stride is built on top of **OpenRemit**, an open-source reference implementation of the Open Payments specification using the **@interledger/open-payments SDK**.

Rather than replacing OpenRemit's payment infrastructure, Stride extends it by adding:

- Automatic digital payslips generated from payment history.
- Worker profiles and payment requests.
- Digital stokvel management.
- A simplified remittance experience designed for informal workers.

## Open Payments Flow

Every payment within Stride follows the same Open Payments workflow:

1. The sender and receiver each have an Interledger wallet address.
2. The application requests a grant to create an incoming payment for the receiver.
3. A payment quote is generated showing the exact amount and fees before payment.
4. The sender authorises the payment through the GNAP grant flow.
5. OpenRemit creates the outgoing payment and transfers the funds.
6. Both parties receive an immutable transaction record.

This payment flow powers:

- Employer to worker payments
- Digital payslip generation
- Stokvel contributions
- Stokvel payouts
- Cross-border remittances

---

# Tech Stack

## Frontend

- React
- JSX
- Vite
- CSS3
- JavaScript (ES6+)

## Backend

- Node.js
- OpenRemit
- @interledger/open-payments SDK

## Standards & APIs

- Open Payments
- Interledger Protocol (ILP)
- GNAP

## Development Tools

- Git
- GitHub
- Visual Studio Code

---

# Repository Structure

```text
.
├── frontend/
├── backend/
├── assets/
├── docs/
└── README.md
```

---

# Current Features

- Digital wallet interface
- QR code payment requests
- Automatic digital payslips
- Digital worker profiles
- Transparent stokvel management
- Cross-border remittances

---

# Hackathon Goals

- Build a functional MVP.
- Demonstrate Open Payments in a real-world financial inclusion use case.
- Deliver an intuitive and accessible user experience.
- Showcase secure, transparent, and affordable digital payments.
- Present a scalable solution for informal workers across Southern Africa.

---

Stride demonstrates how Open Payments can be extended beyond simple money transfers to create financial identity, transparent community savings, and affordable remittances for underserved communities.

