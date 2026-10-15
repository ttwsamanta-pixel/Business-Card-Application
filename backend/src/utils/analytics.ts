import { randomUUID, createHmac } from "crypto";
import type { Request, Response } from "express";
import geoip from "geoip-lite";
import UAParser from "ua-parser-js";
import { config } from "../config.js";
import { store, type CardEvent } from "../store.js";

export async function recordEvent(
  req: Request,
  res: Response,
  cardId: string,
  kind: CardEvent["kind"],
  url?: string,
) {
  const agent = req.get("user-agent") || "";
  if (/bot|crawler|spider|preview|facebookexternalhit/i.test(agent)) return;
  let visitor = req.cookies?.card_visitor;
  if (typeof visitor !== "string" || !/^[a-f0-9-]{36}$/.test(visitor)) {
    visitor = randomUUID();
    res.cookie("card_visitor", visitor, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.NODE_ENV === "production",
      maxAge: 365 * 86400000,
      path: "/",
    });
  }
  const ua = new UAParser(agent).getResult();
  const geo = geoip.lookup((req.ip || "").replace(/^::ffff:/, ""));
  await store.addEvent({
    id: randomUUID(),
    cardId,
    kind,
    visitor: createHmac("sha256", config.JWT_SECRET)
      .update(visitor)
      .digest("hex"),
    createdAt: new Date().toISOString(),
    details: {
      url,
      device: ua.device.model || ua.os.name || "Unknown",
      browser: ua.browser.name || "Unknown",
      country: geo?.country,
      region: geo?.region,
      city: geo?.city,
      latitude: geo?.ll[0],
      longitude: geo?.ll[1],
    },
  });
}

export function summarize(events: CardEvent[], timeZone = "Asia/Kolkata") {
  const views = events.filter((e) => e.kind === "view");
  const parts = (date: string) =>
    Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        hourCycle: "h23",
        weekday: "short",
      })
        .formatToParts(new Date(date))
        .map((p) => [p.type, p.value]),
    );
  const series = (key: (e: CardEvent) => string) => {
    const groups = new Map<string, CardEvent[]>();
    for (const e of views) {
      const k = key(e);
      groups.set(k, [...(groups.get(k) || []), e]);
    }
    return [...groups]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, rows]) => ({
        label,
        total: rows.length,
        unique: new Set(rows.map((r) => r.visitor).filter(Boolean)).size,
      }));
  };
  const breakdown = (key: (e: CardEvent) => string) => {
    const groups = new Map<string, number>();
    for (const e of views) {
      const k = key(e);
      groups.set(k, (groups.get(k) || 0) + 1);
    }
    return [...groups]
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => b.total - a.total);
  };
  const links = new Map<string, number>();
  for (const e of events.filter((e) => e.kind === "link")) {
    const url = e.details.url || "";
    links.set(url, (links.get(url) || 0) + 1);
  }
  return {
    total: views.length,
    unique: new Set(views.map((e) => e.visitor).filter(Boolean)).size,
    forms: events.filter((e) => e.kind === "form").length,
    contacts: events.filter((e) => e.kind === "contact").length,
    clicks: events.filter((e) => e.kind === "link").length,
    timeline: series((e) => {
      const p = parts(e.createdAt);
      return `${p.year}-${p.month}-${p.day}`;
    }),
    hours: series((e) => parts(e.createdAt).hour),
    days: series((e) => parts(e.createdAt).weekday),
    devices: breakdown((e) => e.details.device || "Unknown"),
    browsers: breakdown((e) => e.details.browser || "Unknown"),
    countries: breakdown((e) => e.details.country || "Unknown"),
    regions: breakdown(
      (e) =>
        [e.details.region, e.details.country].filter(Boolean).join(", ") ||
        "Unknown",
    ),
    cities: breakdown(
      (e) =>
        [e.details.city, e.details.country].filter(Boolean).join(", ") ||
        "Unknown",
    ),
    links: [...links]
      .map(([url, total]) => ({ url, total }))
      .sort((a, b) => b.total - a.total),
    locations: views
      .filter((e) => e.details.latitude !== undefined)
      .map((e) => ({
        latitude: e.details.latitude!,
        longitude: e.details.longitude!,
        label: [e.details.city, e.details.country].filter(Boolean).join(", "),
      })),
  };
}
