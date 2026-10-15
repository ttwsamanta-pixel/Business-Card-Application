import { Router } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { masterGroups } from "../masters.js";
import { store } from "../store.js";
import { ok, fail } from "../utils/http.js";

const schema = z
  .object({
    category: z.string(),
    value: z.string().max(80),
    label: z.string().trim().min(1).max(120),
    subtitle: z.string().max(250).default(""),
    iconKey: z.string().max(80).default("globe"),
    iconUrl: z
      .string()
      .max(1000)
      .refine(
        (value) => !value || /^https?:\/\//i.test(value),
        "Use an HTTP image URL",
      )
      .default(""),
    active: z.boolean(),
    sortOrder: z.number().int().min(0).max(9999),
  })
  .superRefine((item, ctx) => {
    if (
      !masterGroups
        .find((group) => group.id === item.category)
        ?.values.includes(item.value)
    )
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Unsupported option behavior",
      });
  });
export const masterRouter = Router();
masterRouter.use(authenticate);
masterRouter.get("/", async (_req, res, next) => {
  try {
    return ok(res, { groups: masterGroups, items: await store.listMasters() });
  } catch (error) {
    next(error);
  }
});
masterRouter.post("/", async (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
      return fail(res, 422, "Invalid master option", parsed.error.flatten());
    const item = { ...parsed.data, id: randomUUID() };
    await store.saveMaster(item);
    return ok(res, item, 201);
  } catch (error) {
    next(error);
  }
});
masterRouter.put("/:id", async (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
      return fail(res, 422, "Invalid master option", parsed.error.flatten());
    const existing = (await store.listMasters()).find(
      (item) => item.id === req.params.id,
    );
    if (!existing) return fail(res, 404, "Master option not found");
    if (existing.category !== parsed.data.category)
      return fail(res, 422, "Category cannot be changed");
    const item = { ...parsed.data, id: existing.id };
    await store.saveMaster(item);
    return ok(res, item);
  } catch (error) {
    next(error);
  }
});
