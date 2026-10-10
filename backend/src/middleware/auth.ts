import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { store } from "../store.js";
import { fail } from "../utils/http.js";

type TokenPayload = { sub: string };

export function signUserToken(userId: string) {
  return jwt.sign({ sub: userId } satisfies TokenPayload, config.JWT_SECRET, { expiresIn: "2h" });
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : req.cookies?.access_token;
  if (!token) return fail(res, 401, "Authentication required");
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as TokenPayload;
    const user = await store.findUserById(payload.sub);
    if (!user || user.status !== "active") return fail(res, 401, "Authentication required");
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
    return next();
  } catch {
    return fail(res, 401, "Authentication required");
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") return fail(res, 403, "Administrator access required");
  return next();
}
