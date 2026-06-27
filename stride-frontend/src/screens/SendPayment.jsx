import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendPayment, consentPayment } from "../api/index.js";

const SENDER_WALLET = "https://ilp.interledger-test.dev/johndoeusd";

function SendPayment() {
    const navigate = useNavigate();
    const [walletAddress, setWalletAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [step, setStep] = useState("form");
    const [quote, setQuote] = useState(null);

    async function handleQuote(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const result = await sendPayment(
                walletAddress,
                amount,
                description,
            );
            setQuote(result);
            setStep("confirm");
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleConsent() {
        setError("");
        setLoading(true);
        try {
            const result = await consentPayment(quote.transactionId);
            window.location.href = result.interactUrl;
        } catch (err) {
            setError(err.message || "Consent failed. Please try again.");
            setLoading(false);
        }
    }

    if (step === "confirm" && quote) {
        const sendAmount = quote.quote?.debitAmount
            ? parseInt(quote.quote.debitAmount.value) /
              Math.pow(10, quote.quote.debitAmount.assetScale)
            : 0;
        const receiveAmount = quote.quote?.receiveAmount
            ? parseInt(quote.quote.receiveAmount.value) /
              Math.pow(10, quote.quote.receiveAmount.assetScale)
            : 0;

        return (
            <div style={styles.container}>
                <div style={styles.topBar}>
                    <button
                        style={styles.backBtn}
                        onClick={() => setStep("form")}
                    >
                        ← Back
                    </button>
                    <h2 style={styles.title}>Confirm Payment</h2>
                </div>

                <div style={styles.quoteCard}>
                    <p style={styles.quoteLabel}>Payment Summary</p>

                    <div style={styles.quoteRow}>
                        <span style={styles.quoteKey}>To</span>
                        <span style={styles.quoteValue}>{walletAddress}</span>
                    </div>
                    <div style={styles.quoteRow}>
                        <span style={styles.quoteKey}>You send</span>
                        <span style={styles.quoteValue}>
                            {quote.quote?.debitAmount?.assetCode}{" "}
                            {sendAmount.toFixed(2)}
                        </span>
                    </div>
                    <div style={styles.quoteRow}>
                        <span style={styles.quoteKey}>They receive</span>
                        <span style={styles.quoteValue}>
                            {quote.quote?.receiveAmount?.assetCode}{" "}
                            {receiveAmount.toFixed(2)}
                        </span>
                    </div>
                    <div style={styles.quoteRow}>
                        <span style={styles.quoteKey}>Description</span>
                        <span style={styles.quoteValue}>{description}</span>
                    </div>
                </div>

                <div style={styles.infoBox}>
                    <p style={styles.infoText}>
                        You will be redirected to your wallet to approve this
                        payment. After approval you will be brought back
                        automatically.
                    </p>
                </div>

                {error && (
                    <div style={styles.errorBox}>
                        <p style={styles.errorText}>{error}</p>
                    </div>
                )}

                <button
                    style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
                    onClick={handleConsent}
                    disabled={loading}
                >
                    {loading ? "Redirecting..." : "Approve & Send"}
                </button>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.topBar}>
                <button
                    style={styles.backBtn}
                    onClick={() => navigate("/home")}
                >
                    ← Back
                </button>
                <h2 style={styles.title}>Send Payment</h2>
            </div>

            <p style={styles.subtitle}>
                Pay a worker directly to their wallet address. A digital payslip
                is generated automatically when the payment completes.
            </p>

            <div style={styles.senderCard}>
                <p style={styles.senderLabel}>Sending from</p>
                <p style={styles.senderWallet}>{SENDER_WALLET}</p>
            </div>

            <form onSubmit={handleQuote} style={styles.form}>
                <div style={styles.field}>
                    <label style={styles.label}>Worker Wallet Address</label>
                    <input
                        style={styles.input}
                        type="text"
                        placeholder="$ilp.interledger-test.dev/johndoezar"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        required
                    />
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>Amount (ZAR)</label>
                    <input
                        style={styles.input}
                        type="number"
                        placeholder="800"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>Work Description</label>
                    <textarea
                        style={styles.textarea}
                        placeholder="e.g. House cleaning, 5 days, June week 4"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        rows={3}
                    />
                    <p style={styles.hint}>
                        This becomes the worker's proof of income — be specific.
                    </p>
                </div>

                {error && (
                    <div style={styles.errorBox}>
                        <p style={styles.errorText}>{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    style={{
                        ...styles.button,
                        opacity:
                            walletAddress && amount && description && !loading
                                ? 1
                                : 0.5,
                    }}
                    disabled={loading}
                >
                    {loading ? "Getting quote..." : "Get Quote"}
                </button>
            </form>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: "32px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    topBar: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
    },
    backBtn: {
        background: "none",
        border: "none",
        fontSize: "15px",
        color: "#1a6b6b",
        cursor: "pointer",
        fontWeight: "bold",
        padding: 0,
    },
    title: {
        fontSize: "20px",
        fontWeight: "bold",
        color: "#2d2d2d",
    },
    subtitle: {
        fontSize: "13px",
        color: "#888888",
        lineHeight: "1.6",
    },
    senderCard: {
        backgroundColor: "#e8f4f4",
        borderRadius: "10px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    senderLabel: {
        fontSize: "11px",
        fontWeight: "bold",
        color: "#1a6b6b",
        textTransform: "uppercase",
        letterSpacing: "1px",
    },
    senderWallet: {
        fontSize: "13px",
        color: "#2d2d2d",
        wordBreak: "break-all",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    field: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    label: {
        fontSize: "13px",
        fontWeight: "bold",
        color: "#2d2d2d",
    },
    input: {
        padding: "14px 16px",
        borderRadius: "10px",
        border: "1px solid #dddddd",
        fontSize: "15px",
        backgroundColor: "#ffffff",
        outline: "none",
    },
    textarea: {
        padding: "14px 16px",
        borderRadius: "10px",
        border: "1px solid #dddddd",
        fontSize: "15px",
        backgroundColor: "#ffffff",
        outline: "none",
        resize: "none",
        fontFamily: "Arial, sans-serif",
    },
    hint: {
        fontSize: "11px",
        color: "#aaaaaa",
        fontStyle: "italic",
    },
    quoteCard: {
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    },
    quoteLabel: {
        fontSize: "11px",
        fontWeight: "bold",
        color: "#aaaaaa",
        letterSpacing: "1px",
        textTransform: "uppercase",
    },
    quoteRow: {
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
    },
    quoteKey: {
        fontSize: "13px",
        color: "#888888",
        flexShrink: 0,
    },
    quoteValue: {
        fontSize: "13px",
        color: "#2d2d2d",
        fontWeight: "bold",
        textAlign: "right",
        wordBreak: "break-all",
    },
    infoBox: {
        backgroundColor: "#fff8e8",
        border: "1px solid #ffe0a0",
        borderRadius: "8px",
        padding: "12px 16px",
    },
    infoText: {
        fontSize: "13px",
        color: "#886600",
        lineHeight: "1.5",
    },
    errorBox: {
        backgroundColor: "#fff0f0",
        border: "1px solid #ffcccc",
        borderRadius: "8px",
        padding: "12px 16px",
    },
    errorText: {
        fontSize: "13px",
        color: "#cc0000",
    },
    button: {
        padding: "16px",
        backgroundColor: "#1a6b6b",
        color: "#ffffff",
        border: "none",
        borderRadius: "10px",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer",
    },
};

export default SendPayment;
