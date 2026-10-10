import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { store } from "../store.js";
import { templates } from "../templates.js";
import { ok, fail } from "../utils/http.js";

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
    templates: templates.length
  });
});

adminRouter.get("/users", async (_req, res) => ok(res, await store.listUsers()));

adminRouter.patch("/users/:id/status", async (req, res) => {
  const status = req.body.status;
  if (!["active", "disabled"].includes(status)) return fail(res, 422, "Status must be active or disabled");
  const user = await store.setUserStatus(req.params.id, status);
  if (!user) return fail(res, 404, "User not found");
  return ok(res, user);
});

adminRouter.get("/cards", async (_req, res) => ok(res, await store.listAllCards()));

adminRouter.get("/templates", (_req, res) => ok(res, templates));

adminRouter.patch("/templates/:id", async (req, res) => {
  if (typeof req.body.active !== "boolean") return fail(res, 422, "active must be a boolean");
  await store.setTemplateActive(req.params.id, req.body.active);
  const template = templates.find((item) => item.id === req.params.id);
  if (template) template.active = req.body.active;
  return ok(res, template);
});
