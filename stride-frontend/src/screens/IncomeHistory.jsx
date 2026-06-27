import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getIncomeHistory } from "../api/index.js";

function IncomeHistory() {
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    useEffect(() => {
        getIncomeHistory().then((data) => {
            setPayments(data);
            setLoading(false);
        });
    }, []);

    const filtered = payments.filter((p) => {
        if (from && p.date < from) return false;
        if (to && p.date > to) return false;
        return true;
    });

    const total = filtered.reduce((sum, p) => sum + p.amount, 0);

    return (
        <div style={styles.container}>
            <div style={styles.topBar}>
                <button
                    style={styles.backBtn}
                    onClick={() => navigate("/home")}
                >
                    ← Back
                </button>
                <h2 style={styles.title}>Income History</h2>
            </div>

            <div style={styles.filterRow}>
                <div style={styles.filterField}>
                    <label style={styles.filterLabel}>From</label>
                    <input
                        type="date"
                        style={styles.filterInput}
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                    />
                </div>
                <div style={styles.filterField}>
                    <label style={styles.filterLabel}>To</label>
                    <input
                        type="date"
                        style={styles.filterInput}
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                    />
                </div>
            </div>

            <div style={styles.summaryCard}>
                <p style={styles.summaryLabel}>Total for period</p>
                <p style={styles.summaryAmount}>R {total.toLocaleString()}</p>
                <p style={styles.summaryCount}>
                    {filtered.length} payment{filtered.length !== 1 ? "s" : ""}
                </p>
            </div>

            <div style={styles.list}>
                {loading ? (
                    <div style={styles.emptyState}>
                        <p>Loading...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p>No payments found for this period.</p>
                    </div>
                ) : (
                    filtered.map((payment) => (
                        <div
                            key={payment.id}
                            style={styles.card}
                            onClick={() => navigate(`/payslip/${payment.id}`)}
                        >
                            <div style={styles.cardLeft}>
                                <p style={styles.cardEmployer}>
                                    {payment.employer}
                                </p>
                                <p style={styles.cardDesc}>
                                    {payment.description}
                                </p>
                                <p style={styles.cardDate}>
                                    {payment.displayDate}
                                </p>
                            </div>
                            <div style={styles.cardRight}>
                                <p
                                    style={{
                                        ...styles.cardAmount,
                                        color: "#1a6b6b",
                                    }}
                                >
                                    +R {payment.amount.toFixed(2)}
                                </p>
                                <span style={styles.badge}>✓ Verified</span>
                                <p style={styles.cardArrow}>View →</p>
                            </div>
                        </div>
                    ))
                )}
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
    filterRow: {
        display: "flex",
        gap: "12px",
    },
    filterField: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    filterLabel: {
        fontSize: "12px",
        fontWeight: "bold",
        color: "#888888",
    },
    filterInput: {
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid #dddddd",
        fontSize: "13px",
        backgroundColor: "#ffffff",
    },
    summaryCard: {
        backgroundColor: "#1a6b6b",
        borderRadius: "12px",
        padding: "20px",
        color: "#ffffff",
    },
    summaryLabel: {
        fontSize: "12px",
        opacity: 0.8,
        marginBottom: "4px",
    },
    summaryAmount: {
        fontSize: "28px",
        fontWeight: "bold",
        marginBottom: "4px",
    },
    summaryCount: {
        fontSize: "12px",
        opacity: 0.7,
    },
    list: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        justifyContent: "space-between",
        cursor: "pointer",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    },
    cardLeft: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        flex: 1,
    },
    cardEmployer: {
        fontSize: "14px",
        fontWeight: "bold",
        color: "#2d2d2d",
    },
    cardDesc: {
        fontSize: "12px",
        color: "#888888",
        maxWidth: "180px",
    },
    cardDate: {
        fontSize: "11px",
        color: "#aaaaaa",
        marginTop: "4px",
    },
    cardRight: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "6px",
    },
    cardAmount: {
        fontSize: "15px",
        fontWeight: "bold",
        color: "#1a6b6b",
    },
    badge: {
        fontSize: "10px",
        backgroundColor: "#e8f4f4",
        color: "#1a6b6b",
        padding: "2px 8px",
        borderRadius: "20px",
        fontWeight: "bold",
    },
    cardArrow: {
        fontSize: "11px",
        color: "#aaaaaa",
    },
    emptyState: {
        textAlign: "center",
        padding: "40px",
        color: "#aaaaaa",
        fontSize: "14px",
    },
};

export default IncomeHistory;
