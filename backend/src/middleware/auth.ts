import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { store } from "../store.js";
import { fail } from "../utils/http.js";
import { effectivePermissions } from "../permissions.js";

type TokenPayload = { sub: string };

export function signUserToken(userId: string) {
  return jwt.sign({ sub: userId } satisfies TokenPayload, config.JWT_SECRET, {
    expiresIn: "2h",
  });
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ")
    ? header.slice(7)
    : req.cookies?.access_token;
  if (!token) return fail(res, 401, "Authentication required");
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as TokenPayload;
    const user = await store.findUserById(payload.sub);
    if (!user || user.status !== "active")
      return fail(res, 401, "Authentication required");
    const permissions = effectivePermissions(
      user.role,
      await store.getPermissions(user.id),
    );
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      profileImageUrl: user.profileImageUrl,
      permissions,
      isSuperAdmin: user.role==='admin' && await store.isSuperAdmin(user.id),
    };
    // Express routes are case-insensitive by default; permission checks must match.
    const path = req.originalUrl.split("?")[0].toLowerCase();
    let required: string[] = [];
    if (path.startsWith("/api/admin/"))
      required = [
        path.startsWith("/api/admin/templates") ? "templates" : "users",
      ];
    else if (path.startsWith("/api/cards"))
      required = req.method === "GET" ? ["cards", "analytics"] : ["cards"];
    else if (path.startsWith("/api/design")) required = ["cards"];
    else if (path.startsWith("/api/management/analytics"))
      required = ["analytics"];
    else if (path.startsWith("/api/management/folders")) required = ["folders"];
    else if (path.startsWith("/api/management/cards")) required = ["cards"];
    else if (path.startsWith("/api/management"))
      required = ["dashboard", "cards", "folders", "analytics"];
    else if (path.startsWith("/api/masters") && req.method !== "GET")
      required = [`master:${req.body.category}`];
    if (required.length && !required.some((key) => permissions.includes(key)))
      return fail(res, 403, "You do not have permission to access this menu");
    return next();
  } catch {
    return fail(res, 401, "Authentication required");
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin")
    return fail(res, 403, "Administrator access required");
  return next();
}
