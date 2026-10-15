import { Router } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { store } from "../store.js";
import { safeCard } from "../utils/card-access.js";
import { summarize } from "../utils/analytics.js";
import { ok, fail } from "../utils/http.js";
export const managementRouter = Router();
managementRouter.use(authenticate);
managementRouter.put("/cards/:id/campaign", async (req, res, next) => {
  try {
    const date = z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(
        (v) =>
          !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
      )
      .or(z.literal(""));
    const p = z.object({ start: date, end: date }).safeParse(req.body);
    if (!p.success || (p.data.start && p.data.end && p.data.start > p.data.end))
      return fail(res, 422, "Enter a valid campaign date range");
    const card = await store.getCardForUser(
      req.user!.id,
      String(req.params.id),
    );
    if (!card) return fail(res, 404, "Card not found");
    const result = await store.updateCard(req.user!.id, card.id, {
      theme: {
        ...card.theme,
        campaignStart: p.data.start,
        campaignEnd: p.data.end,
      },
    });
    return ok(res, safeCard(result!));
  } catch (e) {
    next(e);
  }
});
managementRouter.get("/", async (req, res, next) => {
  try {
    const user = req.user!.id,
      cards = await store.listCards(user),
      events = await store.listEvents(user),
      folders = await store.listFolders(user),
      members = await store.folderMembers(user);
    const month = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
    }).format(new Date());
    return ok(res, {
      cards: cards.map((c) => ({
        ...safeCard(c),
        folderId: members.find((m) => m.cardId === c.id)?.folderId || "",
        scans: events.filter((e) => e.cardId === c.id && e.kind === "view")
          .length,
      })),
      folders: folders.map((f) => ({
        ...f,
        count: members.filter((m) => m.folderId === f.id).length,
      })),
      total: events.filter((e) => e.kind === "view").length,
      month: events.filter(
        (e) =>
          e.kind === "view" &&
          new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
          }).format(new Date(e.createdAt)) === month,
      ).length,
    });
  } catch (e) {
    next(e);
  }
});
managementRouter.get("/analytics", async (req, res, next) => {
  try {
    const query = z
      .object({
        cardId: z.string().uuid().optional(),
        folderId: z.string().uuid().optional(),
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        tz: z.string().max(80).default("Asia/Kolkata"),
      })
      .safeParse(req.query);
    if (!query.success) return fail(res, 422, "Invalid analytics filters");
    const q = query.data;
    try {
      new Intl.DateTimeFormat("en", { timeZone: q.tz });
    } catch {
      return fail(res, 422, "Invalid timezone");
    }
    if (q.from && q.to && q.from > q.to)
      return fail(res, 422, "Start date must precede end date");
    if (q.cardId && !(await store.getCardForUser(req.user!.id, q.cardId)))
      return fail(res, 404, "Card not found");
    if (
      q.folderId &&
      !(await store.listFolders(req.user!.id)).some((f) => f.id === q.folderId)
    )
      return fail(res, 404, "Folder not found");
    const members = await store.folderMembers(req.user!.id);
    const events = (await store.listEvents(req.user!.id)).filter(
      (e) =>
        (!q.cardId || e.cardId === q.cardId) &&
        (!q.folderId ||
          members.some(
            (m) => m.folderId === q.folderId && m.cardId === e.cardId,
          )) &&
        (!q.from || e.createdAt >= q.from) &&
        (!q.to || e.createdAt <= q.to),
    );
    const report = summarize(events, q.tz);
    const selected = (await store.listCards(req.user!.id)).filter(
      (c) =>
        (!q.cardId || c.id === q.cardId) &&
        (!q.folderId ||
          members.some((m) => m.cardId === c.id && m.folderId === q.folderId)),
    );
    let forms = 0;
    for (const card of selected) {
      const leads = await store.listLeads(card.id);
      forms += leads.filter((raw) => {
        const l = raw as { createdAt?: string; created_at?: string };
        const date = new Date(l.createdAt || l.created_at || 0).toISOString();
        return (!q.from || date >= q.from) && (!q.to || date <= q.to);
      }).length;
    }
    report.forms = forms;
    return ok(res, report);
  } catch (e) {
    next(e);
  }
});
managementRouter.post("/folders", async (req, res, next) => {
  try {
    const parsed = z
      .object({ name: z.string().trim().min(1).max(100) })
      .safeParse(req.body);
    if (!parsed.success)
      return fail(res, 422, "Enter a folder name (1-100 characters)");
    if (
      (await store.listFolders(req.user!.id)).some(
        (f) => f.name.toLowerCase() === parsed.data.name.toLowerCase(),
      )
    )
      return fail(res, 409, "Folder already exists");
    const id = randomUUID();
    await store.saveFolder(req.user!.id, id, parsed.data.name);
    return ok(res, { id }, 201);
  } catch (e) {
    next(e);
  }
});
managementRouter.put("/folders/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id),
      folders = await store.listFolders(req.user!.id);
    if (!folders.some((f) => f.id === id))
      return fail(res, 404, "Folder not found");
    const name = z.string().trim().min(1).max(100).safeParse(req.body.name);
    if (!name.success)
      return fail(res, 422, "Enter a folder name (1-100 characters)");
    if (
      folders.some(
        (f) => f.id !== id && f.name.toLowerCase() === name.data.toLowerCase(),
      )
    )
      return fail(res, 409, "Folder already exists");
    await store.saveFolder(req.user!.id, id, name.data);
    return ok(res, { updated: true });
  } catch (e) {
    next(e);
  }
});
managementRouter.delete("/folders/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id);
    if (!(await store.listFolders(req.user!.id)).some((f) => f.id === id))
      return fail(res, 404, "Folder not found");
    await store.deleteFolder(req.user!.id, id);
    return ok(res, { deleted: true });
  } catch (e) {
    next(e);
  }
});
managementRouter.put("/folders", async (req, res, next) => {
  try {
    const parsed = z
      .object({
        cardIds: z.array(z.string().uuid()).min(1).max(100),
        folderId: z.string().uuid().nullable(),
      })
      .safeParse(req.body);
    if (!parsed.success) return fail(res, 422, "Invalid folder assignment");
    const { cardIds, folderId } = parsed.data,
      cards = await store.listCards(req.user!.id);
    if (cardIds.some((id) => !cards.some((c) => c.id === id)))
      return fail(res, 404, "Card not found");
    if (
      folderId &&
      !(await store.listFolders(req.user!.id)).some((f) => f.id === folderId)
    )
      return fail(res, 404, "Folder not found");
    for (const id of cardIds) await store.assignFolder(id, folderId);
    return ok(res, { updated: true });
  } catch (e) {
    next(e);
  }
});
