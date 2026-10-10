import { Router } from "express";
import { store } from "../store.js";
import { ok, fail } from "../utils/http.js";
import { qrPngDataUrl, qrSvg } from "../utils/qr.js";
import { toVCard } from "../utils/vcard.js";
import { config } from "../config.js";

export const publicRouter = Router();

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
  res.setHeader("Content-Disposition", `attachment; filename="${card.slug}.vcf"`);
  res.type("text/vcard").send(toVCard(card));
});
