import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import rateLimit from "express-rate-limit";
import { authenticate } from "../middleware/auth.js";
import { store } from "../store.js";
import { config } from "../config.js";
import { ok, fail } from "../utils/http.js";
import { qrSvg, qrPngDataUrl } from "../utils/qr.js";
const settings = z
  .record(z.string().max(12000))
  .refine((v) => Object.keys(v).length <= 100);
export const designRouter = Router();
designRouter.use(authenticate);
designRouter.get("/presets", async (req, res, next) => {
  try {
    return ok(res, await store.listPresets(req.user!.id));
  } catch (e) {
    next(e);
  }
});
designRouter.post("/presets", async (req, res, next) => {
  try {
    const parsed = z
      .object({
        name: z.string().trim().min(1).max(120),
        kind: z.enum(["style", "qr"]),
        settings,
      })
      .safeParse(req.body);
    if (!parsed.success) return fail(res, 422, "Invalid style");
    if ((await store.listPresets(req.user!.id)).length >= 50)
      return fail(res, 422, "Maximum 50 saved styles");
    const clean = Object.fromEntries(
      Object.entries(parsed.data.settings).filter(
        ([key]) => !key.startsWith("passcode") && key !== "hasPasscode",
      ),
    );
    const preset = { ...parsed.data, settings: clean, id: randomUUID() };
    await store.savePreset(req.user!.id, preset);
    return ok(res, preset, 201);
  } catch (e) {
    next(e);
  }
});
designRouter.delete("/presets/:id", async (req, res, next) => {
  try {
    await store.deletePreset(req.user!.id, req.params.id);
    return ok(res, { deleted: true });
  } catch (e) {
    next(e);
  }
});
designRouter.post(
  "/qr",
  rateLimit({ windowMs: 60000, limit: 120 }),
  async (req, res, next) => {
    try {
      const parsed = z
        .object({
          slug: z
            .string()
            .regex(/^[a-z0-9-]*$/)
            .max(160),
          theme: settings,
          format: z.enum(["svg", "png"]).default("svg"),
        })
        .safeParse(req.body);
      if (!parsed.success) return fail(res, 422, "Invalid QR settings");
      const url = `${config.APP_URL}/card/${parsed.data.slug || "preview"}`;
      const dataUrl =
        parsed.data.format === "png"
          ? await qrPngDataUrl(url, parsed.data.theme)
          : `data:image/svg+xml;base64,${Buffer.from(await qrSvg(url, parsed.data.theme)).toString("base64")}`;
      return ok(res, { dataUrl });
    } catch (e) {
      next(e);
    }
  },
);
