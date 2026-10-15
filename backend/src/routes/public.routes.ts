import { Router } from "express";
import { store } from "../store.js";
import { ok, fail } from "../utils/http.js";
import { qrPngDataUrl, qrSvg } from "../utils/qr.js";
import { toVCard } from "../utils/vcard.js";
import { config } from "../config.js";
import { z } from "zod";
import rateLimit from "express-rate-limit";

export const publicRouter = Router();

publicRouter.post(
  "/cards/:slug/leads",
  rateLimit({ windowMs: 60000, limit: 10 }),
  async (req, res, next) => {
    try {
      const parsed = z
        .object({
          sectionId: z.string().max(80),
          answers: z.record(z.string().max(5000)),
          consent: z.boolean().optional(),
        })
        .safeParse(req.body);
      if (!parsed.success) return fail(res, 422, "Invalid form response");
      const body = parsed.data;
      const card = await store.getPublicCard(String(req.params.slug));
      const section = card?.content?.find(
        (s) => s.id === body.sectionId && s.type === "lead" && s.enabled,
      );
      if (!card || !section) return fail(res, 404, "Form not found");
      if (section.values.consent && !body.consent)
        return fail(res, 422, "Consent is required");
      const answers: Record<string, string> = {};
      for (const field of section.items) {
        const value = (body.answers[field.id] || "").trim();
        if (field.values.required && !value)
          return fail(
            res,
            422,
            String(field.values.error || "This field is required"),
          );
        if (
          value &&
          field.values.type === "Email" &&
          !z.string().email().safeParse(value).success
        )
          return fail(res, 422, "Enter a valid email address");
        const label = String(field.values.label || field.id);
        answers[label in answers ? `${label} (${field.id})` : label] = value;
      }
      await store.addLead(card.id, section.id, answers);
      return ok(res, { submitted: true }, 201);
    } catch (error) {
      next(error);
    }
  },
);

publicRouter.get("/cards/:slug", async (req, res) => {
  const card = await store.getPublicCard(req.params.slug);
  if (!card) return fail(res, 404, "Published card not found");
  return ok(res, card);
});

publicRouter.get("/cards/:slug/qr.png", async (req, res) => {
  const card = await store.getPublicCard(req.params.slug);
  if (!card) return fail(res, 404, "Published card not found");
  const dataUrl = await qrPngDataUrl(`${config.APP_URL}/card/${card.slug}`);
  res.type("png").send(Buffer.from(dataUrl.split(",")[1], "base64"));
});

publicRouter.get("/cards/:slug/qr.svg", async (req, res) => {
  const card = await store.getPublicCard(req.params.slug);
  if (!card) return fail(res, 404, "Published card not found");
  res.type("svg").send(await qrSvg(`${config.APP_URL}/card/${card.slug}`));
});

publicRouter.get("/cards/:slug/vcard.vcf", async (req, res) => {
  const card = await store.getPublicCard(req.params.slug);
  if (!card) return fail(res, 404, "Published card not found");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${card.slug}.vcf"`,
  );
  res.type("text/vcard").send(toVCard(card));
});
