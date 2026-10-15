import QRCode from "qrcode";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { config } from "../config.js";
type Theme = Record<string, string>;
const esc = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
const color = (v: string | undefined, f: string) =>
  /^#[0-9a-f]{6}$/i.test(v || "") ? v! : f;
async function localImage(url?: string) {
  if (!url) return "";
  try {
    const p = new URL(url);
    if (
      p.origin !== new URL(config.API_URL).origin ||
      !/^\/api\/uploads\/files\/[a-f0-9-]+\.(png|jpg|webp|gif)$/.test(
        p.pathname,
      )
    )
      return "";
    const data = await fs.readFile(
      path.join(path.resolve(config.UPLOAD_DIR), path.basename(p.pathname)),
    );
    const png = await sharp(data, { limitInputPixels: 16000000 })
      .resize(512, 512, { fit: "inside" })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return "";
  }
}
export async function qrSvg(value: string, t: Theme = {}) {
  const qr = QRCode.create(value, { errorCorrectionLevel: "H" }),
    n = qr.modules.size;
  const shape = t.qrShape || "square",
    inset =
      (
        {
          square: 36,
          rounded: 36,
          circle: 110,
          hexagon: 110,
          heart: 150,
          diamond: 160,
          shield: 130,
        } as Record<string, number>
      )[shape] || 150,
    size = 640 - inset * 2,
    u = size / (n + 8),
    o = inset + 4 * u;
  const ink = color(t.qrForeground, "#111111"),
    bg = color(t.qrBackground, "#ffffff"),
    stroke = color(t.qrStroke, ink),
    eye = color(t.qrEye, ink),
    eyeStroke = color(t.qrEyeStroke, ink);
  const fill = t.qrGradient === "true" ? "url(#ink)" : ink,
    sticker = t.qrSticker || "none",
    height = sticker === "none" ? 640 : 720;
  const logo = await localImage(t.qrLogo),
    picture = await localImage(t.qrPicture);
  let outline = `<rect x="12" y="12" width="616" height="616" rx="${shape === "rounded" ? 65 : 0}"/>`;
  if (shape === "circle") outline = '<circle cx="320" cy="320" r="304"/>';
  if (shape === "heart")
    outline =
      '<path d="M320 610 C240 550 20 365 20 180 C20 10 240 -20 320 115 C400 -20 620 10 620 180 C620 365 400 550 320 610Z"/>';
  if (shape === "hexagon")
    outline = '<path d="M160 15 H480 L625 320 L480 625 H160 L15 320Z"/>';
  if (shape === "diamond")
    outline = '<path d="M320 8 L632 320 L320 632 L8 320Z"/>';
  if (shape === "shield")
    outline =
      '<path d="M20 55 Q320 -20 620 55 V340 Q610 510 320 625 Q30 510 20 340Z"/>';
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="${height}" viewBox="0 0 640 ${height}"><defs><linearGradient id="ink" x2="${t.qrGradientDirection === "vertical" ? "0" : "1"}" y2="1"><stop stop-color="${ink}"/><stop offset="1" stop-color="${color(t.qrGradientEnd, "#154085")}"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity=".25"/></filter></defs><rect width="640" height="${height}" fill="${bg}"/>`,
  ];
  parts.push(
    `<g fill="${bg}" stroke="${stroke}" stroke-width="6" ${t.qr3d === "true" ? 'filter="url(#shadow)"' : ""}>${outline}</g>`,
  );
  parts.push(`<defs><clipPath id="shape">${outline}</clipPath></defs>`);
  if (picture)
    parts.push(
      `<image href="${picture}" width="640" height="640" clip-path="url(#shape)" preserveAspectRatio="xMidYMid slice"/>`,
    );
  if (!["square", "rounded"].includes(shape)) {
    parts.push(`<g clip-path="url(#shape)" fill="${fill}">`);
    for (let y = 22; y < 618; y += 10)
      for (let x = 22; x < 618; x += 10) {
        if (
          x >= inset - 10 &&
          x <= 640 - inset &&
          y >= inset - 10 &&
          y <= 640 - inset
        )
          continue;
        if ((x * 13 + y * 31 + x * y) % 19 < 8)
          parts.push(`<rect x="${x}" y="${y}" width="7" height="7"/>`);
      }
    parts.push("</g>");
  }
  // Decoration stays outside the quiet zone and never clips encoded modules.
  parts.push(
    `<rect x="${inset}" y="${inset}" width="${size}" height="${size}" fill="${bg}"/>`,
  );
  const isEye = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (qr.modules.get(y, x) && !isEye(x, y)) {
        const px = o + x * u,
          py = o + y * u;
        parts.push(
          t.qrModule === "dots"
            ? `<circle cx="${px + u / 2}" cy="${py + u / 2}" r="${u * 0.49}" fill="${fill}"/>`
            : `<rect x="${px}" y="${py}" width="${u + 0.04}" height="${u + 0.04}" rx="${t.qrModule === "rounded" ? u * 0.25 : 0}" fill="${fill}"/>`,
        );
      }
  for (const [x, y] of [
    [0, 0],
    [n - 7, 0],
    [0, n - 7],
  ]) {
    const px = o + x * u,
      py = o + y * u,
      r = t.qrEyeShape === "rounded";
    parts.push(
      `<rect x="${px}" y="${py}" width="${7 * u}" height="${7 * u}" rx="${r ? u : 0}" fill="${eyeStroke}"/><rect x="${px + u}" y="${py + u}" width="${5 * u}" height="${5 * u}" rx="${r ? u * 0.6 : 0}" fill="${bg}"/><rect x="${px + 2 * u}" y="${py + 2 * u}" width="${3 * u}" height="${3 * u}" rx="${r ? u * 0.5 : 0}" fill="${eye}"/>`,
    );
  }
  if (logo) {
    const w = size * 0.16;
    parts.push(
      `<rect x="${320 - w / 2 - 5}" y="${320 - w / 2 - 5}" width="${w + 10}" height="${w + 10}" rx="4" fill="${bg}"/><image href="${logo}" x="${320 - w / 2}" y="${320 - w / 2}" width="${w}" height="${w}"/>`,
    );
  }
  if (sticker !== "none")
    parts.push(
      `<rect x="12" y="646" width="616" height="62" rx="${sticker === "pill" ? 31 : sticker === "rounded" ? 12 : 0}" fill="${stroke}"/><text x="320" y="686" text-anchor="middle" font-family="Arial" font-size="26" fill="${bg}">${esc((t.qrCaption || "Scan me").slice(0, 35))}</text>`,
    );
  return parts.join("") + "</svg>";
}
export async function qrPngDataUrl(
  value: string,
  theme: Theme = {},
  width = 1280,
) {
  const buffer = await sharp(Buffer.from(await qrSvg(value, theme)))
    .resize({ width })
    .png()
    .toBuffer();
  return `data:image/png;base64,${buffer.toString("base64")}`;
}
