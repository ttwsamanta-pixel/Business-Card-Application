import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import { config, isProduction } from "./config.js";
import { authRouter } from "./routes/auth.routes.js";
import { cardRouter } from "./routes/card.routes.js";
import { templateRouter } from "./routes/template.routes.js";
import { publicRouter } from "./routes/public.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { uploadRouter } from "./routes/upload.routes.js";
import { masterRouter } from './routes/master.routes.js';
import { designRouter } from './routes/design.routes.js';
import { managementRouter } from './routes/management.routes.js';
import { fail } from "./utils/http.js";

export const app = express();

app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: config.FRONTEND_ORIGIN.split(","), credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(path.resolve(config.UPLOAD_DIR), { fallthrough: false }));
app.use('/api/uploads/files', express.static(path.resolve(config.UPLOAD_DIR), { fallthrough: false }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: isProduction ? 40 : 200 });
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

app.get("/health", (_req, res) => res.json({ ok: true, service: "digital-business-card-api" }));
app.use("/api/auth", authRouter);
app.use("/api/cards", cardRouter);
app.use("/api/templates", templateRouter);
app.use("/api/public", publicRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/admin", adminRouter);
app.use('/api/masters',masterRouter);
app.use('/api/design',designRouter);
app.use('/api/management',managementRouter);

app.use((_req, res) => fail(res, 404, "Route not found"));

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'LIMIT_FILE_SIZE') return fail(res,422,`Media must be smaller than ${config.MAX_UPLOAD_MB} MB`);
  if (error && typeof error === "object" && "issues" in error) {
    return fail(res, 422, "Validation failed", error);
  }
  const message = isProduction ? "Unexpected server error" : error instanceof Error ? error.message : "Unexpected server error";
  return fail(res, 500, message);
});
