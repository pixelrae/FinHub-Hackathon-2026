import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "../api/index.js";

function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSignup(e) {
        e.preventDefault();
        setError("");
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        setLoading(true);
        try {
            await signup(email, password, name);
            navigate("/home");
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.logo}>Stride</h1>
                <p style={styles.tagline}>Create your account</p>
            </div>

            <form onSubmit={handleSignup} style={styles.form}>
                <div style={styles.field}>
                    <label style={styles.label}>Full Name</label>
                    <input
                        style={styles.input}
                        type="text"
                        placeholder="Nomsa Dlamini"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>Email</label>
                    <input
                        style={styles.input}
                        type="email"
                        placeholder="nomsa@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>Password</label>
                    <input
                        style={styles.input}
                        type="password"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
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
                        opacity: loading ? 0.6 : 1,
                    }}
                    disabled={loading}
                >
                    {loading ? "Creating account..." : "Create Account"}
                </button>

                <p style={styles.loginText}>
                    Already have an account?{" "}
                    <span
                        style={styles.link}
                        onClick={() => navigate("/login")}
                    >
                        Log in
                    </span>
                </p>
            </form>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "32px 24px",
        backgroundColor: "#f5f5f5",
    },
    header: {
        textAlign: "center",
        marginBottom: "40px",
    },
    logo: {
        fontSize: "42px",
        fontWeight: "bold",
        color: "#1a6b6b",
        letterSpacing: "2px",
    },
    tagline: {
        fontSize: "14px",
        color: "#888888",
        marginTop: "6px",
        fontStyle: "italic",
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
        marginTop: "8px",
    },
    loginText: {
        textAlign: "center",
        fontSize: "13px",
        color: "#888888",
    },
    link: {
        color: "#1a6b6b",
        fontWeight: "bold",
        cursor: "pointer",
    },
};

export default Signup;
