import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getIncomeHistory,
    logout,
    getMe,
    getSentHistory,
} from "../api/index.js";

function Home() {
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
        getMe().then(setUser);
        getIncomeHistory().then((received) => {
            if (received.length > 0) {
                setPayments(received);
            } else {
                getSentHistory().then((sent) => {
                    setPayments(sent);
                });
            }
        });
    }, []);

    const totalEarned = payments.reduce((sum, p) => sum + p.amount, 0);

    function handleLogout() {
        logout();
        navigate("/login");
    }

    const avatarLetter = user?.displayName?.[0] || "?";

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.avatar}>{avatarLetter}</div>
                    <div>
                        <p style={styles.greeting}>Good morning,</p>
                        <h2 style={styles.name}>
                            {user?.displayName || "..."}
                        </h2>
                    </div>
                </div>
                <button style={styles.logoutBtn} onClick={handleLogout}>
                    Log out
                </button>
            </div>

            <div style={styles.balanceCard}>
                <p style={styles.balanceLabel}>
                    {payments.length > 0 && payments[0].employer
                        ? "Total Received via Stride"
                        : "Total Paid via Stride"}
                </p>
                <h1 style={styles.balanceAmount}>R {totalEarned.toFixed(2)}</h1>
                <p style={styles.walletAddress}>{user?.walletAddress || ""}</p>
            </div>

            <div style={styles.actionsGrid}>
                <button
                    style={styles.actionCard}
                    onClick={() => navigate("/income")}
                >
                    <span style={styles.actionIcon}>📄</span>
                    <span style={styles.actionLabel}>Income History</span>
                </button>
                <button
                    style={styles.actionCard}
                    onClick={() => navigate("/send")}
                >
                    <span style={styles.actionIcon}>💸</span>
                    <span style={styles.actionLabel}>Send Payment</span>
                </button>
                <button
                    style={styles.actionCard}
                    onClick={() => navigate("/qr")}
                >
                    <span style={styles.actionIcon}>📲</span>
                    <span style={styles.actionLabel}>My QR Code</span>
                </button>
                <button
                    style={styles.actionCard}
                    onClick={() => navigate("/report")}
                >
                    <span style={styles.actionIcon}>📑</span>
                    <span style={styles.actionLabel}>Income Report</span>
                </button>
                <button
                    style={styles.actionCard}
                    onClick={() => navigate("/sent")}
                >
                    <span style={styles.actionIcon}>📤</span>
                    <span style={styles.actionLabel}>Payment History</span>
                </button>
            </div>

            <div style={styles.recentSection}>
                <h3 style={styles.recentTitle}>Recent Payments</h3>
                {payments.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p>No payments yet.</p>
                    </div>
                ) : (
                    payments.slice(0, 3).map((payment) => (
                        <div
                            key={payment.id}
                            style={styles.recentItem}
                            onClick={() => navigate(`/payslip/${payment.id}`)}
                        >
                            <div style={styles.recentLeft}>
                                <p style={styles.recentEmployer}>
                                    {payment.employer || payment.worker}
                                </p>
                                <p style={styles.recentDesc}>
                                    {payment.description}
                                </p>
                            </div>
                            <div style={styles.recentRight}>
                                <p
                                    style={{
                                        ...styles.recentAmount,
                                        color: payment.employer
                                            ? "#1a6b6b"
                                            : "#cc0000",
                                    }}
                                >
                                    {payment.employer ? "+" : "-"}R{" "}
                                    {payment.amount.toFixed(2)}
                                </p>
                                <p style={styles.recentDate}>
                                    {payment.displayDate}
                                </p>
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
        gap: "24px",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerLeft: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    greeting: {
        fontSize: "13px",
        color: "#888888",
    },
    name: {
        fontSize: "20px",
        fontWeight: "bold",
        color: "#2d2d2d",
    },
    avatar: {
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        backgroundColor: "#1a6b6b",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
        fontWeight: "bold",
    },
    logoutBtn: {
        background: "none",
        border: "1px solid #dddddd",
        borderRadius: "8px",
        padding: "6px 12px",
        fontSize: "12px",
        color: "#888888",
        cursor: "pointer",
    },
    balanceCard: {
        backgroundColor: "#1a6b6b",
        borderRadius: "16px",
        padding: "28px 24px",
        color: "#ffffff",
    },
    balanceLabel: {
        fontSize: "13px",
        opacity: 0.8,
        marginBottom: "8px",
    },
    balanceAmount: {
        fontSize: "36px",
        fontWeight: "bold",
        marginBottom: "12px",
    },
    walletAddress: {
        fontSize: "11px",
        opacity: 0.7,
        wordBreak: "break-all",
    },
    actionsGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
    },
    actionCard: {
        backgroundColor: "#ffffff",
        border: "none",
        borderRadius: "12px",
        padding: "16px 8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        cursor: "pointer",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    },
    actionIcon: {
        fontSize: "24px",
    },
    actionLabel: {
        fontSize: "11px",
        fontWeight: "bold",
        color: "#2d2d2d",
        textAlign: "center",
    },
    recentSection: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    recentTitle: {
        fontSize: "16px",
        fontWeight: "bold",
        color: "#2d2d2d",
    },
    recentItem: {
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    },
    recentLeft: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    recentEmployer: {
        fontSize: "14px",
        fontWeight: "bold",
        color: "#2d2d2d",
    },
    recentDesc: {
        fontSize: "12px",
        color: "#888888",
        maxWidth: "180px",
    },
    recentRight: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "4px",
    },
    recentAmount: {
        fontSize: "15px",
        fontWeight: "bold",
        color: "#1a6b6b",
    },
    recentDate: {
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

export default Home;
