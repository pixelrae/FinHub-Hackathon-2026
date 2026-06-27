import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/index.js";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleLogin(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            navigate("/home");
        } catch (err) {
            setError("Invalid email or password. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.logo}>Stride</h1>
                <p style={styles.tagline}>Your money. With proof.</p>
            </div>

            <form onSubmit={handleLogin} style={styles.form}>
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
                        placeholder="••••••••"
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
                    {loading ? "Logging in..." : "Log In"}
                </button>

                <p style={styles.signupText}>
                    Don't have an account?{" "}
                    <span
                        style={styles.link}
                        onClick={() => navigate("/signup")}
                    >
                        Sign up
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
    signupText: {
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

export default Login;
