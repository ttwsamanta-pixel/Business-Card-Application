import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import type { Request } from "express";
import type { BusinessCard } from "../types.js";
import { config } from "../config.js";
export function safeCard(card: BusinessCard) {
  const theme = { ...card.theme };
  theme.hasPasscode = theme.passcodeHash ? "true" : "false";
  delete theme.passcodeHash;
  delete theme.passcode;
  return { ...card, theme };
}
export async function prepareTheme(
  theme: Record<string, string>,
  previous: Record<string, string> = {},
) {
  const result = { ...theme };
  delete result.passcodeHash;
  delete result.hasPasscode;
  if (result.passcodeEnabled === "true") {
    if (result.passcode) {
      if (result.passcode.length < 6 || result.passcode.length > 72)
        throw new Error("Passcode must be 6 to 72 characters.");
      result.passcodeHash = await bcrypt.hash(result.passcode, 12);
    } else if (previous.passcodeHash)
      result.passcodeHash = previous.passcodeHash;
    else throw new Error("Enter a passcode before enabling protection.");
    const minutes = Number(result.passcodeMinutes || 480);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 10080)
      throw new Error("Session timeout must be 1 to 10080 minutes.");
    result.passcodeMinutes = String(minutes);
  }
  delete result.passcode;
  return result;
}
const version = (card: BusinessCard) =>
  createHash("sha256")
    .update(card.theme?.passcodeHash || "")
    .digest("hex");
export const accessCookie = (card: BusinessCard) => `card_access_${card.id}`;
export function accessToken(card: BusinessCard) {
  return jwt.sign(
    { purpose: "card-access", cardId: card.id, version: version(card) },
    config.JWT_SECRET,
    { expiresIn: Number(card.theme?.passcodeMinutes || 480) * 60 },
  );
}
export function canReadCard(req: Request, card: BusinessCard) {
  if (card.theme?.passcodeEnabled !== "true") return true;
  try {
    const t = jwt.verify(
      req.cookies?.[accessCookie(card)],
      config.JWT_SECRET,
    ) as jwt.JwtPayload;
    return (
      t.purpose === "card-access" &&
      t.cardId === card.id &&
      t.version === version(card)
    );
  } catch {
    return false;
  }
}
export function passcodePrompt(card: BusinessCard) {
  const t = card.theme || {};
  return {
    locked: true,
    slug: card.slug,
    heading: t.passcodeHeading || "Passcode Protected Page",
    description: t.passcodeDescription || "Enter the passcode to continue.",
    label: t.passcodeLabel || "Enter Passcode",
    button: t.passcodeButton || "Proceed",
    image: t.passcodeImageEnabled === "true" ? t.passcodeImage : "",
  };
}
