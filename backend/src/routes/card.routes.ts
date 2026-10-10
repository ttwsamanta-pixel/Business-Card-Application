import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { store } from "../store.js";
import { templateById } from "../templates.js";
import { cardPatchSchema, cardSchema } from "../validation.js";
import { fail, ok } from "../utils/http.js";
import { uniqueSlug } from "../utils/slug.js";
import { qrPngDataUrl, qrSvg } from "../utils/qr.js";
import { toVCard } from "../utils/vcard.js";

export const cardRouter = Router();

cardRouter.use(authenticate);

cardRouter.post("/", async (req, res) => {
  const body = cardSchema.parse(req.body);
  if (!templateById(body.templateId)) return fail(res, 422, "Selected template is not available");
  const card = await store.createCard(req.user!.id, { ...body, slug: body.slug || uniqueSlug(body.fullName) });
  return ok(res, card, 201);
});

cardRouter.get("/", async (req, res) => ok(res, await store.listCards(req.user!.id)));

cardRouter.get("/:id", async (req, res) => {
  const card = await store.getCardForUser(req.user!.id, req.params.id);
  if (!card) return fail(res, 404, "Card not found");
  return ok(res, card);
});

cardRouter.put("/:id", async (req, res) => {
  const body = cardPatchSchema.parse(req.body);
  if (body.templateId && !templateById(body.templateId)) return fail(res, 422, "Selected template is not available");
  const card = await store.updateCard(req.user!.id, req.params.id, body);
  if (!card) return fail(res, 404, "Card not found");
  return ok(res, card);
});

cardRouter.post("/:id/duplicate", async (req, res) => {
  const card = await store.duplicateCard(req.user!.id, req.params.id);
  if (!card) return fail(res, 404, "Card not found");
  return ok(res, card, 201);
});

cardRouter.post("/:id/publish", async (req, res) => {
  const existing = await store.getCardForUser(req.user!.id, req.params.id);
  if (!existing) return fail(res, 404, "Card not found");
  if (!existing.fullName || !existing.templateId) return fail(res, 422, "Full name and template are required before publishing");
  const card = await store.updateCard(req.user!.id, req.params.id, { status: "published" });
  return ok(res, card);
});

cardRouter.post("/:id/unpublish", async (req, res) => {
  const card = await store.updateCard(req.user!.id, req.params.id, { status: "draft", publishedAt: undefined });
  if (!card) return fail(res, 404, "Card not found");
  return ok(res, card);
});

cardRouter.delete("/:id", async (req, res) => {
  const deleted = await store.deleteCard(req.user!.id, req.params.id);
  if (!deleted) return fail(res, 404, "Card not found");
  return ok(res, { deleted: true });
});

cardRouter.get("/:id/qr.png", async (req, res) => {
  const card = await store.getCardForUser(req.user!.id, req.params.id);
  if (!card || card.status !== "published") return fail(res, 404, "Published card not found");
  const dataUrl = await qrPngDataUrl(`${process.env.APP_URL || "http://localhost:3000"}/card/${card.slug}`);
  const data = Buffer.from(dataUrl.split(",")[1], "base64");
  res.type("png").send(data);
});

cardRouter.get("/:id/qr.svg", async (req, res) => {
  const card = await store.getCardForUser(req.user!.id, req.params.id);
  if (!card || card.status !== "published") return fail(res, 404, "Published card not found");
  res.type("svg").send(await qrSvg(`${process.env.APP_URL || "http://localhost:3000"}/card/${card.slug}`));
});

cardRouter.get("/:id/vcard.vcf", async (req, res) => {
  const card = await store.getCardForUser(req.user!.id, req.params.id);
  if (!card) return fail(res, 404, "Card not found");
  res.setHeader("Content-Disposition", `attachment; filename="${card.slug}.vcf"`);
  res.type("text/vcard").send(toVCard(card));
});
