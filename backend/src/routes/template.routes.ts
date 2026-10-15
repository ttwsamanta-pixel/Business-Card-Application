import { Router } from "express";
import { store } from "../store.js";
import { ok, fail } from "../utils/http.js";

export const templateRouter = Router();

templateRouter.get("/", async (req, res) => {
  const templates=await store.listTemplates();
  const category = String(req.query.category || "");
  const search = String(req.query.search || "").toLowerCase();
  const data = templates.filter((template) => template.active)
    .filter((template) => !category || category === "All" || template.category === category)
    .filter((template) => !search || `${template.name} ${template.category} ${template.description}`.toLowerCase().includes(search));
  return ok(res, data);
});

templateRouter.get("/categories", async (_req, res) => {
  const templates=await store.listTemplates();
  return ok(res, ["All", ...Array.from(new Set(templates.filter((template) => template.active).map((template) => template.category)))]);
});

templateRouter.get("/:id", async (req, res) => {
  const templates=await store.listTemplates();
  const template = templates.find((item) => item.id === req.params.id && item.active);
  if (!template) return fail(res, 404, "Template not found");
  return ok(res, template);
});
