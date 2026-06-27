import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPayslip } from "../api/index.js";

function Payslip() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPayslip(id).then((data) => {
            setPayment(data);
            setLoading(false);
        });
    }, [id]);

    function handleShare() {
        if (navigator.share) {
            navigator.share({
                title: "Stride Payslip",
                text: `Proof of payment: R${payment.amount} from ${payment.employer} on ${payment.displayDate}`,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Payslip link copied to clipboard");
        }
    }

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.topBar}>
                    <button
                        style={styles.backBtn}
                        onClick={() => navigate("/income")}
                    >
                        ← Back
                    </button>
                </div>
                <div style={styles.centered}>
                    <p style={styles.muted}>Loading payslip...</p>
                </div>
            </div>
        );
    }

    if (!payment) {
        return (
            <div style={styles.container}>
                <div style={styles.topBar}>
                    <button
                        style={styles.backBtn}
                        onClick={() => navigate("/income")}
                    >
                        ← Back
                    </button>
                </div>
                <div style={styles.centered}>
                    <p style={styles.muted}>Payslip not found.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.topBar}>
                <button
                    style={styles.backBtn}
                    onClick={() => navigate("/income")}
                >
                    ← Back
                </button>
                <h2 style={styles.title}>Payslip</h2>
            </div>

            <div style={styles.payslip}>
                <div style={styles.payslipHeader}>
                    <div>
                        <h1 style={styles.payslipLogo}>Stride</h1>
                        <p style={styles.payslipSubtitle}>Digital Payslip</p>
                    </div>
                    <div style={styles.verifiedBadge}>✓ Verified</div>
                </div>

                <div style={styles.divider} />

                <div style={styles.partiesRow}>
                    <div style={styles.party}>
                        <p style={styles.partyLabel}>EMPLOYER</p>
                        <p style={styles.partyName}>{payment.employer}</p>
                        <p style={styles.partyWallet}>
                            {payment.employerWallet}
                        </p>
                    </div>
                    <div style={styles.partyDivider} />
                    <div style={styles.party}>
                        <p style={styles.partyLabel}>WORKER</p>
                        <p style={styles.partyName}>{payment.worker}</p>
                        <p style={styles.partyWallet}>{payment.workerWallet}</p>
                    </div>
                </div>

                <div style={styles.divider} />

                <div style={styles.detailsRow}>
                    <div style={styles.detail}>
                        <p style={styles.detailLabel}>Date</p>
                        <p style={styles.detailValue}>{payment.displayDate}</p>
                    </div>
                    <div style={styles.detail}>
                        <p style={styles.detailLabel}>Amount</p>
                        <p style={styles.detailValue}>
                            R {payment.amount.toFixed(2)}
                        </p>
                    </div>
                    <div style={styles.detail}>
                        <p style={styles.detailLabel}>Currency</p>
                        <p style={styles.detailValue}>{payment.currency}</p>
                    </div>
                </div>

                <div style={styles.divider} />

                <div style={styles.section}>
                    <p style={styles.detailLabel}>Work Description</p>
                    <p style={styles.descriptionText}>{payment.description}</p>
                </div>

                <div style={styles.divider} />

                <div style={styles.section}>
                    <p style={styles.detailLabel}>Transaction ID</p>
                    <p style={styles.transactionId}>{payment.transactionId}</p>
                    <p style={styles.networkText}>
                        ✓ Verified on the Interledger Network
                    </p>
                    <p style={styles.statusText}>Status: {payment.status}</p>
                </div>
            </div>

            <button style={styles.shareButton} onClick={handleShare}>
                Share Payslip
            </button>
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
    centered: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    muted: {
        color: "#aaaaaa",
        fontSize: "14px",
    },
    payslip: {
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    payslipHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    payslipLogo: {
        fontSize: "26px",
        fontWeight: "bold",
        color: "#1a6b6b",
        letterSpacing: "1px",
    },
    payslipSubtitle: {
        fontSize: "12px",
        color: "#888888",
        marginTop: "2px",
    },
    verifiedBadge: {
        backgroundColor: "#e8f4f4",
        color: "#1a6b6b",
        fontSize: "11px",
        fontWeight: "bold",
        padding: "4px 12px",
        borderRadius: "20px",
    },
    divider: {
        height: "1px",
        backgroundColor: "#eeeeee",
    },
    partiesRow: {
        display: "flex",
        gap: "16px",
    },
    party: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    partyDivider: {
        width: "1px",
        backgroundColor: "#eeeeee",
    },
    partyLabel: {
        fontSize: "10px",
        fontWeight: "bold",
        color: "#aaaaaa",
        letterSpacing: "1px",
    },
    partyName: {
        fontSize: "14px",
        fontWeight: "bold",
        color: "#2d2d2d",
    },
    partyWallet: {
        fontSize: "10px",
        color: "#aaaaaa",
        wordBreak: "break-all",
    },
    detailsRow: {
        display: "flex",
        justifyContent: "space-between",
    },
    detail: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    detailLabel: {
        fontSize: "10px",
        fontWeight: "bold",
        color: "#aaaaaa",
        letterSpacing: "1px",
        textTransform: "uppercase",
    },
    detailValue: {
        fontSize: "14px",
        fontWeight: "bold",
        color: "#2d2d2d",
    },
    section: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    descriptionText: {
        fontSize: "14px",
        color: "#2d2d2d",
        lineHeight: "1.5",
    },
    transactionId: {
        fontSize: "11px",
        color: "#888888",
        wordBreak: "break-all",
        fontFamily: "monospace",
    },
    networkText: {
        fontSize: "12px",
        color: "#1a6b6b",
        fontWeight: "bold",
    },
    statusText: {
        fontSize: "12px",
        color: "#888888",
    },
    shareButton: {
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

export default Payslip;
