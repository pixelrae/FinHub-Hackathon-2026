import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMe } from "../api/index.js";

const BASE_URL = "http://localhost:3001";

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
}

function QRCode() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [qrImageUrl, setQrImageUrl] = useState(null);

    useEffect(() => {
        getMe().then(setUser);
    }, []);

    async function handleGenerate() {
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/qr/generate`, {
                method: "POST",
                headers: getAuthHeaders(),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || "Failed to generate QR code");
            setQrData(data);

            // Load QR image
            const imgRes = await fetch(`${BASE_URL}/api/qr/download`, {
                headers: getAuthHeaders(),
            });
            const blob = await imgRes.blob();
            const url = URL.createObjectURL(blob);
            setQrImageUrl(url);
        } catch (err) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    async function handleDownload() {
        const res = await fetch(`${BASE_URL}/api/qr/download`, {
            headers: getAuthHeaders(),
        });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "stride-qr.png";
        a.click();
        URL.revokeObjectURL(url);
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
                <h2 style={styles.title}>My QR Code</h2>
            </div>

            <div style={styles.infoCard}>
                <p style={styles.infoTitle}>Your Payment QR Code</p>
                <p style={styles.infoText}>
                    Generate your personal QR code and give it to employers.
                    They scan it with any camera app and pay you directly — no
                    Stride account needed on their side.
                </p>
            </div>

            {!qrData && !qrImageUrl && (
                <div style={styles.emptyCard}>
                    <p style={styles.emptyIcon}>📲</p>
                    <p style={styles.emptyText}>
                        You haven't generated your QR code yet.
                    </p>
                    {error && <p style={styles.errorText}>{error}</p>}
                    <button
                        style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
                        onClick={handleGenerate}
                        disabled={loading}
                    >
                        {loading ? "Generating..." : "Generate My QR Code"}
                    </button>
                </div>
            )}

            {qrImageUrl && (
                <div style={styles.qrCard}>
                    <img
                        src={qrImageUrl}
                        alt="Stride QR Code"
                        style={styles.qrImage}
                    />

                    <div style={styles.qrDetails}>
                        <p style={styles.qrLabel}>Payment Page</p>
                        <p style={styles.qrUrl}>{qrData?.paymentPageUrl}</p>
                    </div>

                    <div style={styles.qrDetails}>
                        <p style={styles.qrLabel}>Your Handle</p>
                        <p style={styles.qrHandle}>@{qrData?.walletHandle}</p>
                    </div>

                    <div style={styles.buttonRow}>
                        <button
                            style={styles.downloadBtn}
                            onClick={handleDownload}
                        >
                            Download PNG
                        </button>
                        <button
                            style={styles.regenerateBtn}
                            onClick={handleGenerate}
                            disabled={loading}
                        >
                            {loading ? "..." : "Regenerate"}
                        </button>
                    </div>
                </div>
            )}

            <div style={styles.instructionsCard}>
                <p style={styles.instructionsTitle}>How it works</p>
                <div style={styles.step}>
                    <span style={styles.stepNumber}>1</span>
                    <p style={styles.stepText}>
                        Generate and download your QR code
                    </p>
                </div>
                <div style={styles.step}>
                    <span style={styles.stepNumber}>2</span>
                    <p style={styles.stepText}>
                        Print it or show it on your phone to your employer
                    </p>
                </div>
                <div style={styles.step}>
                    <span style={styles.stepNumber}>3</span>
                    <p style={styles.stepText}>
                        Employer scans and pays — no app needed on their side
                    </p>
                </div>
                <div style={styles.step}>
                    <span style={styles.stepNumber}>4</span>
                    <p style={styles.stepText}>
                        Payment appears in your income history automatically
                    </p>
                </div>
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
    infoCard: {
        backgroundColor: "#e8f4f4",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    infoTitle: {
        fontSize: "14px",
        fontWeight: "bold",
        color: "#1a6b6b",
    },
    infoText: {
        fontSize: "13px",
        color: "#2d2d2d",
        lineHeight: "1.6",
    },
    emptyCard: {
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "40px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        textAlign: "center",
    },
    emptyIcon: {
        fontSize: "48px",
    },
    emptyText: {
        fontSize: "14px",
        color: "#888888",
    },
    errorText: {
        fontSize: "13px",
        color: "#cc0000",
    },
    button: {
        padding: "14px 32px",
        backgroundColor: "#1a6b6b",
        color: "#ffffff",
        border: "none",
        borderRadius: "10px",
        fontSize: "15px",
        fontWeight: "bold",
        cursor: "pointer",
    },
    qrCard: {
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    },
    qrImage: {
        width: "220px",
        height: "220px",
        borderRadius: "12px",
    },
    qrDetails: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    qrLabel: {
        fontSize: "11px",
        fontWeight: "bold",
        color: "#aaaaaa",
        letterSpacing: "1px",
        textTransform: "uppercase",
    },
    qrUrl: {
        fontSize: "12px",
        color: "#2d2d2d",
        wordBreak: "break-all",
    },
    qrHandle: {
        fontSize: "16px",
        fontWeight: "bold",
        color: "#1a6b6b",
    },
    buttonRow: {
        display: "flex",
        gap: "12px",
        width: "100%",
    },
    downloadBtn: {
        flex: 1,
        padding: "14px",
        backgroundColor: "#1a6b6b",
        color: "#ffffff",
        border: "none",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "bold",
        cursor: "pointer",
    },
    regenerateBtn: {
        flex: 1,
        padding: "14px",
        backgroundColor: "#ffffff",
        color: "#1a6b6b",
        border: "2px solid #1a6b6b",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "bold",
        cursor: "pointer",
    },
    instructionsCard: {
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    },
    instructionsTitle: {
        fontSize: "14px",
        fontWeight: "bold",
        color: "#2d2d2d",
    },
    step: {
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
    },
    stepNumber: {
        width: "24px",
        height: "24px",
        borderRadius: "50%",
        backgroundColor: "#1a6b6b",
        color: "#ffffff",
        fontSize: "12px",
        fontWeight: "bold",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    stepText: {
        fontSize: "13px",
        color: "#888888",
        lineHeight: "1.5",
        paddingTop: "2px",
    },
};

export default QRCode;
