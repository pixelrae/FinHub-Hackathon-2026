import { useEffect } from "react";
import {
    Routes,
    Route,
    Navigate,
    useNavigate,
    useSearchParams,
} from "react-router-dom";
import Login from "./screens/Login";
import Signup from "./screens/Signup";
import Home from "./screens/Home";
import IncomeHistory from "./screens/IncomeHistory";
import Payslip from "./screens/Payslip";
import SendPayment from "./screens/SendPayment";
import PaymentStatus from "./screens/PaymentStatus";
import ProtectedRoute from "./components/ProtectedRoute";
import QRCode from "./screens/QRCode";
import Report from "./screens/Report";
import SentHistory from "./screens/SentHistory";

function CallbackCatcher() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const id = searchParams.get("id");
        const status = searchParams.get("status");
        if (id && status) {
            navigate(`/status?id=${id}&status=${status}`, { replace: true });
        } else {
            navigate("/login", { replace: true });
        }
    }, []);

    return null;
}

function App() {
    return (
        <Routes>
            <Route path="/" element={<CallbackCatcher />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
                path="/home"
                element={
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/income"
                element={
                    <ProtectedRoute>
                        <IncomeHistory />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/payslip/:id"
                element={
                    <ProtectedRoute>
                        <Payslip />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/send"
                element={
                    <ProtectedRoute>
                        <SendPayment />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/status"
                element={
                    <ProtectedRoute>
                        <PaymentStatus />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/qr"
                element={
                    <ProtectedRoute>
                        <QRCode />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/report"
                element={
                    <ProtectedRoute>
                        <Report />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/sent"
                element={
                    <ProtectedRoute>
                        <SentHistory />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

export default App;
