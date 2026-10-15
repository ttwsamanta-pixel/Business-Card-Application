import type { BusinessCard } from "../types.js";
import { config } from "../config.js";

function esc(value = "") {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function toVCard(card: BusinessCard) {
  if (card.content) {
    const contacts = card.content.filter(
      (s) => s.type === "contact" && s.enabled,
    );
    const rows = contacts
      .flatMap((s) => s.items)
      .flatMap(({ values: v }) => {
        if (v.type === "Phone" && v.value)
          return [`TEL;TYPE=CELL:${esc(String(v.value))}`];
        if (v.type === "Email" && v.value)
          return [`EMAIL:${esc(String(v.value))}`];
        if (v.type === "Address")
          return [
            `ADR;TYPE=WORK:;;${esc(String(v.value ?? [v.line1, v.line2].filter(Boolean).join(" ")))};${esc(String(v.value!==undefined?'':v.city || ""))};${esc(String(v.value!==undefined?'':v.state || ""))};${esc(String(v.value!==undefined?'':v.zip || ""))};${esc(String(v.value!==undefined?'':v.country || ""))}`,
          ];
        return [];
      });
    return [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${esc(card.fullName)}`,
      card.company ? `ORG:${esc(card.company)}` : "",
      card.designation ? `TITLE:${esc(card.designation)}` : "",
      ...rows,
      contacts.some((s) => s.values.saveLink)
        ? `URL:${esc(`${config.APP_URL}/card/${card.slug}`)}`
        : "",
      "END:VCARD",
    ]
      .filter(Boolean)
      .join("\r\n");
  }
  const url = card.website?.startsWith("http")
    ? card.website
    : card.website
      ? `https://${card.website}`
      : "";
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(card.fullName)}`,
    card.company ? `ORG:${esc(card.company)}` : "",
    card.designation ? `TITLE:${esc(card.designation)}` : "",
    card.phone ? `TEL;TYPE=CELL:${esc(card.phone)}` : "",
    card.email ? `EMAIL:${esc(card.email)}` : "",
    card.address ? `ADR;TYPE=WORK:;;${esc(card.address)}` : "",
    url ? `URL:${esc(url)}` : "",
    card.bio ? `NOTE:${esc(card.bio)}` : "",
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\r\n");
}
