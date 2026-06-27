import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getPaymentStatus } from "../api/index.js";

function PaymentStatus() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const transactionId = searchParams.get("id");
    const [status, setStatus] = useState("PENDING");
    const [tx, setTx] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!transactionId) return;

        const poll = setInterval(async () => {
            try {
                const data = await getPaymentStatus(transactionId);
                setTx(data);
                setStatus(data.status);
                if (data.status === "COMPLETED" || data.status === "FAILED") {
                    clearInterval(poll);
                }
            } catch (err) {
                setError("Could not fetch payment status.");
                clearInterval(poll);
            }
        }, 2000);

        return () => clearInterval(poll);
    }, [transactionId]);

    if (!transactionId) {
        return (
            <div style={styles.container}>
                <div style={styles.centered}>
                    <p style={styles.muted}>No transaction found.</p>
                    <button
                        style={styles.btn}
                        onClick={() => navigate("/home")}
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    if (status === "COMPLETED") {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.iconSuccess}>✓</div>
                    <h2 style={styles.successTitle}>Payment Complete</h2>
                    <p style={styles.successDesc}>
                        The payment was sent successfully. The worker's payslip
                        has been generated automatically.
                    </p>
                    <button
                        style={styles.btn}
                        onClick={() => navigate("/home")}
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    if (status === "FAILED") {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.iconFailed}>✕</div>
                    <h2 style={styles.failedTitle}>Payment Failed</h2>
                    <p style={styles.failedDesc}>
                        Something went wrong. Please try again.
                    </p>
                    <button
                        style={styles.btn}
                        onClick={() => navigate("/send")}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.spinner}>⏳</div>
                <h2 style={styles.pendingTitle}>Processing Payment</h2>
                <p style={styles.pendingDesc}>
                    Please wait while we confirm your payment on the Interledger
                    network...
                </p>
                {error && <p style={styles.errorText}>{error}</p>}
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: "32px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    centered: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "40px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        textAlign: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
        width: "100%",
        maxWidth: "360px",
    },
    iconSuccess: {
        width: "72px",
        height: "72px",
        borderRadius: "50%",
        backgroundColor: "#1a6b6b",
        color: "#ffffff",
        fontSize: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    iconFailed: {
        width: "72px",
        height: "72px",
        borderRadius: "50%",
        backgroundColor: "#cc0000",
        color: "#ffffff",
        fontSize: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    spinner: {
        fontSize: "48px",
    },
    successTitle: {
        fontSize: "22px",
        fontWeight: "bold",
        color: "#2d2d2d",
    },
    successDesc: {
        fontSize: "14px",
        color: "#888888",
        lineHeight: "1.6",
    },
    failedTitle: {
        fontSize: "22px",
        fontWeight: "bold",
        color: "#cc0000",
    },
    failedDesc: {
        fontSize: "14px",
        color: "#888888",
        lineHeight: "1.6",
    },
    pendingTitle: {
        fontSize: "22px",
        fontWeight: "bold",
        color: "#2d2d2d",
    },
    pendingDesc: {
        fontSize: "14px",
        color: "#888888",
        lineHeight: "1.6",
    },
    muted: {
        fontSize: "14px",
        color: "#aaaaaa",
    },
    errorText: {
        fontSize: "13px",
        color: "#cc0000",
    },
    btn: {
        padding: "14px 32px",
        backgroundColor: "#1a6b6b",
        color: "#ffffff",
        border: "none",
        borderRadius: "10px",
        fontSize: "15px",
        fontWeight: "bold",
        cursor: "pointer",
        marginTop: "8px",
    },
};

export default PaymentStatus;
