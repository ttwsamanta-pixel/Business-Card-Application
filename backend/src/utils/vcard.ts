import type { BusinessCard } from "../types.js";

function esc(value = "") {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function toVCard(card: BusinessCard) {
  const url = card.website?.startsWith("http") ? card.website : card.website ? `https://${card.website}` : "";
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
    "END:VCARD"
  ].filter(Boolean).join("\r\n");
}
