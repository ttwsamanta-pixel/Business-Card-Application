import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { store } from "../store.js";
import { templates } from "../templates.js";
import { adminCreateUserSchema } from "../validation.js";
import { ok, fail } from "../utils/http.js";
import { effectivePermissions, menuKeys } from "../permissions.js";
import { safeCard } from "../utils/card-access.js";

export const adminRouter = Router();

adminRouter.use(authenticate, requireAdmin);

adminRouter.get("/overview", async (_req, res) => {
  const users = await store.listUsers();
  const cards = await store.listAllCards();
  return ok(res, {
    users: users.length,
    activeUsers: users.filter((user) => user.status === "active").length,
    cards: cards.length,
    publishedCards: cards.filter((card) => card.status === "published").length,
    draftCards: cards.filter((card) => card.status === "draft").length,
    templates: templates.length,
  });
});

adminRouter.get("/users", async (_req, res) =>
  ok(
    res,
    await Promise.all(
      (await store.listUsers()).map(async (user) => ({
        ...user,
        permissions: effectivePermissions(
          user.role,
          await store.getPermissions(user.id),
        ),
      })),
    ),
  ),
);

adminRouter.put("/users/:id/permissions", async (req, res) => {
  const parsed = z
    .array(z.enum(menuKeys as [string, ...string[]]))
    .max(menuKeys.length)
    .safeParse(req.body.permissions);
  if (!parsed.success) return fail(res, 422, "Invalid menu permissions");
  if (req.params.id === req.user!.id)
    return fail(res, 400, "You cannot change your own permissions");
  const user = await store.findUserById(req.params.id);
  if (!user) return fail(res, 404, "User not found");
  const permissions = effectivePermissions(user.role, parsed.data);
  await store.setPermissions(user.id, permissions);
  return ok(res, { permissions });
});

adminRouter.patch("/users/:id", async (req, res, next) => {
  try {
    const parsed = adminCreateUserSchema
      .omit({ password: true })
      .safeParse(req.body);
    if (!parsed.success)
      return fail(res, 422, "Invalid user data", parsed.error.flatten());
    const user = await store.findUserById(req.params.id);
    if (!user) return fail(res, 404, "User not found");
    const body = parsed.data;
    if (
      user.id === req.user!.id &&
      (body.role !== "admin" || body.status !== "active")
    )
      return fail(res, 400, "You cannot disable or demote your own account");
    const duplicate = await store.findUserByEmail(body.email);
    if (duplicate && duplicate.id !== user.id)
      return fail(res, 409, "Email already registered");
    await store.editUser(user.id, body);
    return ok(res, { updated: true });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/users", async (req, res, next) => {
  try {
    const body = adminCreateUserSchema.parse(req.body);
    if (await store.findUserByEmail(body.email))
      return fail(res, 409, "Email already registered");
    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await store.createUser({
      name: body.name,
      email: body.email,
      passwordHash,
      role: body.role,
      status: body.status,
    });
    return ok(res, user, 201);
  } catch (error) {
    if (error instanceof z.ZodError)
      return fail(res, 422, "Invalid user data", error.flatten());
    return next(error);
  }
});

adminRouter.patch("/users/:id/status", async (req, res) => {
  const status = req.body.status;
  if (!["active", "disabled"].includes(status))
    return fail(res, 422, "Status must be active or disabled");
  if (req.params.id === req.user!.id && status === "disabled")
    return fail(res, 400, "You cannot disable your own account");
  const user = await store.setUserStatus(req.params.id, status);
  if (!user) return fail(res, 404, "User not found");
  return ok(res, user);
});

adminRouter.patch("/users/:id/role", async (req, res) => {
  const role = req.body.role;
  if (!["user", "admin"].includes(role))
    return fail(res, 422, "Role must be user or admin");
  if (req.params.id === req.user!.id && role !== "admin")
    return fail(res, 400, "You cannot remove your own admin role");
  const user = await store.setUserRole(req.params.id, role);
  if (!user) return fail(res, 404, "User not found");
  return ok(res, user);
});

adminRouter.delete("/users/:id", async (req, res) => {
  if (req.params.id === req.user!.id)
    return fail(res, 400, "You cannot delete your own account");
  const deleted = await store.deleteUser(req.params.id);
  if (!deleted) return fail(res, 404, "User not found");
  return ok(res, { deleted: true });
});

adminRouter.get("/cards", async (_req, res) =>
  ok(res, (await store.listAllCards()).map(safeCard)),
);

adminRouter.get("/templates", async (_req, res) =>
  ok(res, await store.listTemplates()),
);

adminRouter.patch("/templates/:id", async (req, res) => {
  if (typeof req.body.active !== "boolean")
    return fail(res, 422, "active must be a boolean");
  if (!templates.some((item) => item.id === req.params.id))
    return fail(res, 404, "Template not found");
  await store.setTemplateActive(req.params.id, req.body.active);
  const template = templates.find((item) => item.id === req.params.id);
  return ok(res, { ...template, active: req.body.active });
});
