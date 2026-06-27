import { config } from "./config";
import express from "express";
import cors from "cors";
import { remitRouter } from "./routes/remit";
import { callbackRouter } from "./routes/callback";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { requestsRouter } from "./routes/requests";
import { newsRouter } from "./routes/news";
import { qrRouter } from "./routes/qr";
import { payRouter } from "./routes/pay";
import { reportRouter } from "./routes/report";
import { errorHandler } from "./middleware/errorHandler";
import { seedNews } from "./lib/seedNews";

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "stride-backend" });
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/news", newsRouter);
app.use("/api/remit", remitRouter);
app.use("/api/callback", callbackRouter);
app.use("/api/qr", qrRouter);
app.use("/pay", payRouter);
app.use("/api/report", reportRouter);

app.use(errorHandler);

seedNews().catch((err) => console.error("[seed] News seed failed:", err));

app.listen(config.port, () => {
    console.log(`\n  Stride backend → http://localhost:${config.port}\n`);
});
