import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { isProduction } from "../config.js";
import { authenticate, signUserToken } from "../middleware/auth.js";
import { store } from "../store.js";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "../validation.js";
import { fail, ok } from "../utils/http.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    if (isProduction) return fail(res, 403, "Registration is closed. Please contact the administrator for access.");
    const body = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await store.createUser({ name: body.name, email: body.email, passwordHash });
    const token = signUserToken(user.id);
    res.cookie("access_token", token, { httpOnly: true, sameSite: "lax", secure: isProduction, maxAge: 2 * 60 * 60 * 1000 });
    return ok(res, { user, token }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return fail(res, 422, "Invalid registration data", error.flatten());
    return next(error);
  }
});

authRouter.post("/login", async (req, res) => {
  const body = loginSchema.parse(req.body);
  const user = await store.findUserByEmail(body.email);
  if (!user || user.status !== "active") return fail(res, 401, "Invalid email or password");
  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) return fail(res, 401, "Invalid email or password");
  const token = signUserToken(user.id);
  res.cookie("access_token", token, { httpOnly: true, sameSite: "lax", secure: isProduction, maxAge: 2 * 60 * 60 * 1000 });
  return ok(res, { user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status }, token });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("access_token");
  return ok(res, { loggedOut: true });
});

authRouter.get("/me", authenticate, (req, res) => ok(res, { user: req.user }));

authRouter.post("/forgot-password", async (req, res) => {
  const body = forgotPasswordSchema.parse(req.body);
  const user = await store.findUserByEmail(body.email);
  let devToken: string | undefined;
  if (user) {
    const token = randomBytes(32).toString("hex");
    await store.createPasswordReset(user.id, token, new Date(Date.now() + 60 * 60 * 1000));
    if (process.env.NODE_ENV !== "production") devToken = token;
  }
  return ok(res, { message: "If the account exists, password reset instructions have been sent.", devToken });
});

authRouter.post("/reset-password", async (req, res) => {
  const body = resetPasswordSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(body.password, 12);
  const changed = await store.consumePasswordReset(body.token, passwordHash);
  if (!changed) return fail(res, 400, "Invalid or expired reset token");
  return ok(res, { changed: true });
});
