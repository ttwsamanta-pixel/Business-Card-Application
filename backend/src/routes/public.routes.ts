import { Router } from "express";
import { store } from "../store.js";
import { ok, fail } from "../utils/http.js";
import { qrPngDataUrl, qrSvg } from "../utils/qr.js";
import { toVCard } from "../utils/vcard.js";
import { config } from "../config.js";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import bcrypt from 'bcryptjs';
import { accessCookie, accessToken, canReadCard, passcodePrompt, safeCard } from '../utils/card-access.js';
import {recordEvent} from '../utils/analytics.js';

export const publicRouter = Router();
publicRouter.post('/cards/:slug/events',rateLimit({windowMs:60000,limit:120}),async(req,res,next)=>{try{
 const card=await store.getPublicCard(String(req.params.slug));if(!card)return fail(res,404,'Card not found');
 if(!canReadCard(req,card))return fail(res,403,'Passcode required');
 const event=z.object({kind:z.literal('link'),url:z.string().min(1).max(2048).refine(v=>/^(https?:|mailto:|tel:)/i.test(v))}).safeParse(req.body);
 if(!event.success)return fail(res,422,'Invalid event');
 await recordEvent(req,res,card.id,'link',event.data.url);return ok(res,{recorded:true});
}catch(e){next(e);}});
publicRouter.post('/cards/:slug/visits',rateLimit({windowMs:60000,limit:20}),async(req,res,next)=>{try{
  const card=await store.getPublicCard(String(req.params.slug));
  if(!card)return fail(res,404,'Card not found');
  if(!canReadCard(req,card))return fail(res,403,'Passcode required');
  const parsed=z.object({consent:z.literal(true).optional(),location:z.object({latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),accuracy:z.number().min(0).max(1000000)}).optional()}).safeParse(req.body);
  if(!parsed.success)return fail(res,422,'Invalid location');
  if(parsed.data.location&&(card.theme?.preciseLocation!=='true'||!parsed.data.consent))return fail(res,422,'Location consent required');
  if(parsed.data.location)await store.addVisit(card.id,parsed.data.location);
  else await recordEvent(req,res,card.id,'view');
  return ok(res,{recorded:true});
}catch(e){next(e);}});
publicRouter.post('/cards/:slug/unlock',rateLimit({windowMs:15*60000,limit:20}),async(req,res,next)=>{
  try {
    const card=await store.getPublicCard(String(req.params.slug));
    if(!card)return fail(res,404,'Card not found');
    const code=z.string().min(1).max(72).safeParse(req.body.passcode);
    if(!code.success||!card.theme?.passcodeHash||!await bcrypt.compare(code.data,card.theme.passcodeHash))return fail(res,403,'Incorrect passcode');
    res.cookie(accessCookie(card),accessToken(card),{httpOnly:true,secure:config.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:Number(card.theme.passcodeMinutes||480)*60000});
    return ok(res,{unlocked:true});
  }catch(error){next(error);}
});

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
      if(!canReadCard(req,card))return fail(res,403,'Passcode required');
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
      await recordEvent(req,res,card.id,'form');
      return ok(res, { submitted: true }, 201);
    } catch (error) {
      next(error);
    }
  },
);

publicRouter.get("/cards/:slug", async (req, res) => {
  const card = await store.getPublicCard(req.params.slug);
  if (!card) return fail(res, 404, "Published card not found");
  res.setHeader('Cache-Control','private, no-store');
  if(!canReadCard(req,card))return ok(res,passcodePrompt(card));
  const masters = await store.listMasters();
  const content = card.content?.map(section => section.type !== 'links' ? section : {
    ...section,
    items: section.items.map(item => {
      const values = item.values;
      const master = masters.find(m => m.category === 'links' && m.id === values.masterId)
        || masters.find(m => m.category === 'links' && (m.label === values.title || m.label === values.platform));
      return { ...item, values: { ...values, icon: values.icon || master?.iconUrl || '' } };
    }),
  });
  return ok(res, safeCard({ ...card, content }));
});

publicRouter.get("/cards/:slug/qr.png", async (req, res) => {
  const card = await store.getPublicCard(req.params.slug);
  if (!card) return fail(res, 404, "Published card not found");
  const dataUrl = await qrPngDataUrl(`${config.APP_URL}/card/${card.slug}`,card.theme);
  res.type("png").send(Buffer.from(dataUrl.split(",")[1], "base64"));
});

publicRouter.get("/cards/:slug/qr.svg", async (req, res) => {
  const card = await store.getPublicCard(req.params.slug);
  if (!card) return fail(res, 404, "Published card not found");
  res.type("svg").send(await qrSvg(`${config.APP_URL}/card/${card.slug}`,card.theme));
});

publicRouter.get("/cards/:slug/vcard.vcf", async (req, res) => {
  const card = await store.getPublicCard(req.params.slug);
  if (!card) return fail(res, 404, "Published card not found");
  if(!canReadCard(req,card))return fail(res,403,'Passcode required');
  res.setHeader('Cache-Control','private, no-store');
  await recordEvent(req,res,card.id,'contact');
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${card.slug}.vcf"`,
  );
  res.type("text/vcard").send(toVCard(card));
});
