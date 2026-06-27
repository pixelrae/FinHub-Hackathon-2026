const BASE_URL = "http://localhost:3001";

function getToken() {
    return localStorage.getItem("token");
}

function authHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
    };
}

// ─── AUTH ────────────────────────────────────────────────

export async function login(email, password) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    localStorage.setItem("token", data.token);
    return data.user;
}

export async function signup(email, password, name) {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName: name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");
    localStorage.setItem("token", data.token);
    return data.user;
}

export function logout() {
    localStorage.removeItem("token");
}

export function isLoggedIn() {
    return !!localStorage.getItem("token");
}

export async function getMe() {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch user");
    return data;
}

// ─── PAYMENTS ────────────────────────────────────────────

export async function getIncomeHistory() {
    const res = await fetch(`${BASE_URL}/api/remit/history`, {
        headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch history");

    return data
        .filter((t) => t.direction === "received" && t.status === "COMPLETED")
        .map((t) => ({
            id: t.id,
            employer: t.payerRef || t.counterpartyName || "Unknown Employer",
            description: t.description || "No description",
            amount:
                parseInt(t.receiveAmount) / Math.pow(10, t.receiveAssetScale),
            currency: t.receiveAssetCode || "ZAR",
            date: new Date(t.createdAt).toISOString().split("T")[0],
            displayDate: new Date(t.createdAt).toLocaleDateString("en-ZA", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }),
            status: t.status,
        }));
}

export async function getSentHistory() {
    const res = await fetch(`${BASE_URL}/api/remit/history`, {
        headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch history");

    return data
        .filter((t) => t.direction === "sent" && t.status === "COMPLETED")
        .map((t) => ({
            id: t.id,
            worker:
                t.counterpartyName ||
                t.counterpartyWallet?.split("/").pop() ||
                "Unknown Worker",
            description: t.description || "No description",
            amount:
                parseInt(t.receiveAmount) / Math.pow(10, t.receiveAssetScale),
            currency: t.receiveAssetCode || "ZAR",
            date: new Date(t.createdAt).toISOString().split("T")[0],
            displayDate: new Date(t.createdAt).toLocaleDateString("en-ZA", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }),
            status: t.status,
        }));
}

export async function getPayslip(id) {
    const res = await fetch(`${BASE_URL}/api/remit/history`, {
        headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch payslip");

    const t = data.find((t) => t.id === id);
    if (!t) return null;

    return {
        id: t.id,
        employer: t.payerRef || t.counterpartyName || "Unknown Employer",
        employerWallet: t.counterpartyWallet || "",
        worker: "Nomsa Dlamini",
        workerWallet: t.receiverWalletAddress || "",
        description: t.description || "No description",
        amount: parseInt(t.receiveAmount) / Math.pow(10, t.receiveAssetScale),
        currency: t.receiveAssetCode || "ZAR",
        displayDate: new Date(t.createdAt).toLocaleDateString("en-ZA", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }),
        transactionId: t.id,
        status: t.status,
    };
}

export async function sendPayment(walletAddress, amount, description) {
    const infoRes = await fetch(
        `${BASE_URL}/api/remit/wallet-info?url=${encodeURIComponent(walletAddress)}`,
        { headers: authHeaders() },
    );
    const walletInfo = await infoRes.json();
    if (!infoRes.ok)
        throw new Error(walletInfo.error || "Could not resolve wallet");

    const scaledAmount = String(
        Math.round(parseFloat(amount) * Math.pow(10, walletInfo.assetScale)),
    );

    const quoteRes = await fetch(`${BASE_URL}/api/remit/quote`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            senderWalletAddress: "https://ilp.interledger-test.dev/johndoeusd",
            receiverWalletAddress: walletAddress,
            amount: scaledAmount,
            paymentType: "FIXED_RECEIVE",
            description,
        }),
    });
    const quoteData = await quoteRes.json();
    if (!quoteRes.ok) throw new Error(quoteData.error || "Quote failed");

    return quoteData;
}

export async function consentPayment(transactionId) {
    const res = await fetch(`${BASE_URL}/api/remit/consent`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ transactionId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Consent failed");
    return data;
}

export async function getPaymentStatus(transactionId) {
    const res = await fetch(`${BASE_URL}/api/remit/status/${transactionId}`, {
        headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Status check failed");
    return data;
}
