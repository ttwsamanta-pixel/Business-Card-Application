import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { store } from "../store.js";
import { cardPatchSchema, cardSchema } from "../validation.js";
import { fail, ok } from "../utils/http.js";
import { uniqueSlug } from "../utils/slug.js";
import { qrPngDataUrl, qrSvg } from "../utils/qr.js";
import { toVCard } from "../utils/vcard.js";
import { applyMasterDefaults } from '../masters.js';
import { prepareTheme, safeCard } from '../utils/card-access.js';
import { accessibleCard, visibleCards } from '../utils/owner-scope.js';

export const cardRouter = Router();

cardRouter.use(authenticate);
cardRouter.param('id',async(req,res,next,id)=>{
  try{
    const card=await accessibleCard(req.user!,id);
    if(!card)return fail(res,404,'Card not found');
    res.locals.cardOwnerId=card.userId;
    next();
  }catch(error){next(error);}
});

cardRouter.post("/", async (req, res, next) => {
  try {
  const parsed = cardSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(
      res,
      422,
      parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; "),
    );
  const body = parsed.data;
  if(body.theme)try{body.theme=await prepareTheme(body.theme);}catch(e){return fail(res,422,(e as Error).message);}
  if(body.content)body.content=applyMasterDefaults(body.content,await store.listMasters());
  if (!(await store.listTemplates()).some(t=>t.id===body.templateId&&t.active))
    return fail(res, 422, "Selected template is not available");
  const card = await store.createCard(req.user!.id, {
    ...body,
    slug: body.slug || uniqueSlug(body.fullName),
  });
  return ok(res, safeCard(card), 201);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY") return fail(res, 409, "This page URL is already in use. Choose another URL.");
    next(error);
  }
});

cardRouter.get("/", async (req, res) =>
  ok(res, (await visibleCards(req.user!)).map(safeCard)),
);

cardRouter.get("/:id", async (req, res) => {
  const card = await store.getCardForUser(res.locals.cardOwnerId, req.params.id);
  if (!card) return fail(res, 404, "Card not found");
  return ok(res, safeCard(card));
});

cardRouter.get("/:id/leads", async (req, res) => {
  const card = await store.getCardForUser(res.locals.cardOwnerId, req.params.id);
  if (!card) return fail(res, 404, "Card not found");
  return ok(res, await store.listLeads(card.id));
});
cardRouter.get('/:id/visits',async(req,res,next)=>{try{const card=await store.getCardForUser(res.locals.cardOwnerId,req.params.id);if(!card)return fail(res,404,'Card not found');return ok(res,await store.listVisits(card.id));}catch(e){next(e);}});

cardRouter.put("/:id", async (req, res, next) => {
  try {
  const parsed = cardPatchSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(
      res,
      422,
      parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; "),
    );
  const body = parsed.data;
  const previous=await store.getCardForUser(res.locals.cardOwnerId,req.params.id);
  if(!previous)return fail(res,404,'Card not found');
  if(body.theme)try{body.theme=await prepareTheme(body.theme,previous.theme);}catch(e){return fail(res,422,(e as Error).message);}
  if(body.content)body.content=applyMasterDefaults(body.content,await store.listMasters());
  if (body.templateId && body.templateId!==previous.templateId && !(await store.listTemplates()).some(t=>t.id===body.templateId&&t.active))
    return fail(res, 422, "Selected template is not available");
  const card = await store.updateCard(res.locals.cardOwnerId, req.params.id, body);
  if (!card) return fail(res, 404, "Card not found");
  return ok(res, safeCard(card));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY") return fail(res, 409, "This page URL is already in use. Choose another URL.");
    next(error);
  }
});

cardRouter.post("/:id/duplicate", async (req, res) => {
  const card = await store.duplicateCard(res.locals.cardOwnerId, req.params.id);
  if (!card) return fail(res, 404, "Card not found");
  return ok(res, safeCard(card), 201);
});

cardRouter.post("/:id/publish", async (req, res) => {
  const existing = await store.getCardForUser(res.locals.cardOwnerId, req.params.id);
  if (!existing) return fail(res, 404, "Card not found");
  if (!existing.fullName || !existing.templateId)
    return fail(
      res,
      422,
      "Full name and template are required before publishing",
    );
  const card = await store.updateCard(res.locals.cardOwnerId, req.params.id, {
    status: "published",
  });
  return ok(res, card ? safeCard(card) : card);
});

cardRouter.post("/:id/unpublish", async (req, res) => {
  const card = await store.updateCard(res.locals.cardOwnerId, req.params.id, {
    status: "draft",
    publishedAt: undefined,
  });
  if (!card) return fail(res, 404, "Card not found");
  return ok(res, safeCard(card));
});

cardRouter.delete("/:id", async (req, res) => {
  const deleted = await store.deleteCard(res.locals.cardOwnerId, req.params.id);
  if (!deleted) return fail(res, 404, "Card not found");
  return ok(res, { deleted: true });
});

cardRouter.get("/:id/qr.png", async (req, res) => {
  const card = await store.getCardForUser(res.locals.cardOwnerId, req.params.id);
  if (!card) return fail(res, 404, "Card not found");
  const dataUrl = await qrPngDataUrl(
    `${process.env.APP_URL || "http://localhost:3000"}/card/${card.slug}`,
    card.theme,
  );
  const data = Buffer.from(dataUrl.split(",")[1], "base64");
  res.type("png").send(data);
});

cardRouter.get("/:id/qr.svg", async (req, res) => {
  const card = await store.getCardForUser(res.locals.cardOwnerId, req.params.id);
  if (!card) return fail(res, 404, "Card not found");
  res
    .type("svg")
    .send(
      await qrSvg(
        `${process.env.APP_URL || "http://localhost:3000"}/card/${card.slug}`,
        card.theme,
      ),
    );
});

cardRouter.get("/:id/vcard.vcf", async (req, res) => {
  const card = await store.getCardForUser(res.locals.cardOwnerId, req.params.id);
  if (!card) return fail(res, 404, "Card not found");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${card.slug}.vcf"`,
  );
  res.type("text/vcard").send(toVCard(card));
});
