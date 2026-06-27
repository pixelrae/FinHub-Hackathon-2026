import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "http://localhost:3001";

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
}

function Report() {
    const navigate = useNavigate();
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleDownload() {
        setError("");

        if (!from || !to) {
            setError("Please select both a start and end date.");
            return;
        }

        if (from > to) {
            setError("Start date cannot be after end date.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(
                `${BASE_URL}/api/report/generate?from=${from}&to=${to}`,
                { headers: getAuthHeaders() },
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to generate report");
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `stride-income-report-${from}-to-${to}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
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
                <h2 style={styles.title}>Income Report</h2>
            </div>

            <div style={styles.infoCard}>
                <p style={styles.infoTitle}>Proof of Income PDF</p>
                <p style={styles.infoText}>
                    Download a signed PDF report of all your received payments
                    for any date range. Share it with a bank, landlord, or
                    employer as proof of income. The report includes a
                    verification signature that anyone can check online.
                </p>
            </div>

            <div style={styles.formCard}>
                <p style={styles.formTitle}>Select Date Range</p>

                <div style={styles.dateRow}>
                    <div style={styles.dateField}>
                        <label style={styles.label}>From</label>
                        <input
                            type="date"
                            style={styles.input}
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                        />
                    </div>
                    <div style={styles.dateField}>
                        <label style={styles.label}>To</label>
                        <input
                            type="date"
                            style={styles.input}
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div style={styles.errorBox}>
                        <p style={styles.errorText}>{error}</p>
                    </div>
                )}

                <button
                    style={{
                        ...styles.button,
                        opacity: loading || !from || !to ? 0.5 : 1,
                    }}
                    onClick={handleDownload}
                    disabled={loading || !from || !to}
                >
                    {loading ? "Generating PDF..." : "Download PDF Report"}
                </button>
            </div>

            <div style={styles.exampleCard}>
                <p style={styles.exampleTitle}>What's included in the report</p>
                <div style={styles.exampleRow}>
                    <span style={styles.exampleIcon}>📅</span>
                    <p style={styles.exampleText}>Date of each payment</p>
                </div>
                <div style={styles.exampleRow}>
                    <span style={styles.exampleIcon}>👤</span>
                    <p style={styles.exampleText}>
                        Employer name or wallet reference
                    </p>
                </div>
                <div style={styles.exampleRow}>
                    <span style={styles.exampleIcon}>📝</span>
                    <p style={styles.exampleText}>
                        Work description for each payment
                    </p>
                </div>
                <div style={styles.exampleRow}>
                    <span style={styles.exampleIcon}>💰</span>
                    <p style={styles.exampleText}>
                        Amount received per payment
                    </p>
                </div>
                <div style={styles.exampleRow}>
                    <span style={styles.exampleIcon}>📊</span>
                    <p style={styles.exampleText}>
                        Total earned and average per payment
                    </p>
                </div>
                <div style={styles.exampleRow}>
                    <span style={styles.exampleIcon}>🔐</span>
                    <p style={styles.exampleText}>
                        HMAC signature for tamper verification
                    </p>
                </div>
            </div>

            <div style={styles.verifyCard}>
                <p style={styles.verifyTitle}>For lenders and landlords</p>
                <p style={styles.verifyText}>
                    Every report contains a unique verification link in the
                    footer. Open it in any browser to confirm the report is
                    authentic and has not been altered.
                </p>
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
    formCard: {
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    },
    formTitle: {
        fontSize: "14px",
        fontWeight: "bold",
        color: "#2d2d2d",
    },
    dateRow: {
        display: "flex",
        gap: "12px",
    },
    dateField: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    label: {
        fontSize: "12px",
        fontWeight: "bold",
        color: "#888888",
    },
    input: {
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid #dddddd",
        fontSize: "13px",
        backgroundColor: "#f9f9f9",
        outline: "none",
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
    exampleCard: {
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    },
    exampleTitle: {
        fontSize: "14px",
        fontWeight: "bold",
        color: "#2d2d2d",
        marginBottom: "4px",
    },
    exampleRow: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    exampleIcon: {
        fontSize: "18px",
        flexShrink: 0,
    },
    exampleText: {
        fontSize: "13px",
        color: "#888888",
    },
    verifyCard: {
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        borderLeft: "4px solid #1a6b6b",
    },
    verifyTitle: {
        fontSize: "14px",
        fontWeight: "bold",
        color: "#1a6b6b",
    },
    verifyText: {
        fontSize: "13px",
        color: "#888888",
        lineHeight: "1.6",
    },
};

export default Report;
