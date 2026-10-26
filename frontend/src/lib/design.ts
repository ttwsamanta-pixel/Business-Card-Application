import postcss from "postcss";
export type Theme = Record<string, string>;
export const fontSizes = [
  {
    key: "nameFontSize",
    label: "Profile name",
    defaultValue: 28,
    min: 18,
    max: 48,
    selectors: [".profile-hero h3", ".cover-copy h3", ".split-copy h3"],
  },
  {
    key: "profileFontSize",
    label: "Designation and company",
    defaultValue: 16,
    min: 12,
    max: 24,
    selectors: [
      ".profile-hero p",
      ".profile-hero strong",
      ".cover-copy p",
      ".cover-copy strong",
      ".split-copy p",
      ".split-copy strong",
    ],
  },
  {
    key: "headingFontSize",
    label: "Section headings",
    defaultValue: 20,
    min: 14,
    max: 32,
    selectors: [".info-card h4", ".qr-card h4"],
  },
  {
    key: "bodyFontSize",
    label: "Body and contact text",
    defaultValue: 16,
    min: 12,
    max: 24,
    selectors: [
      ".info-card p",
      ".info-card a",
      ".contact-master-label",
      ".link-row",
      ".link-row span",
      ".social-link-row",
      ".social-link-row small",
      ".link-row small",
      ".qr-card p",
    ],
  },
] as const;
export type DesignPreset = {
  id: string;
  name: string;
  kind: "style" | "qr";
  settings: Theme;
};
export const fonts = [
  "Arial",
  "Georgia",
  "Verdana",
  "Tahoma",
  "Courier New",
  "Work Sans",
  "Open Sans",
  "Roboto",
  "Playfair Display",
  "Josefin Sans",
  "Slabo 27px",
  "Concert One",
  "Krona One",
  "Syne",
  "Federo",
  "Viaoda Libre",
  "Handlee",
  "Poppins",
  "Montserrat",
  "Lato",
  "Spectral",
  "Manrope",
  "Mukta",
  "Marcellus",
  "Mulish",
  "DM Serif Text",
  "DM Sans",
  "Be Vietnam Pro",
  "DM Serif Display",
];
export const palettes = [
  ["#5278ff", "#d7faff"],
  ["#384599", "#d5f9fa"],
  ["#d71149", "#ffc0da"],
  ["#ff8b00", "#ffe2aa"],
  ["#826036", "#d1ffbd"],
  ["#459fa8", "#c5faff"],
  ["#1c529a", "#bedfff"],
  ["#696de6", "#d8d9ff"],
  ["#f72f69", "#fff0e9"],
  ["#6b3d2e", "#fff0ad"],
  ["#e6bc00", "#fff2a0"],
  ["#15845d", "#c7fbd7"],
  ["#9cb763", "#f2ffcc"],
  ["#273acb", "#d6dbff"],
  ["#e30a12", "#ffcece"],
  ["#200e6f", "#d9ceff"],
  ["#111111", "#eeeeee"],
  ["#37b34a", "#c3ffd1"],
  ["#c78a00", "#fff3c4"],
  ["#749000", "#faffb8"],
];
export const backgrounds = [
  [
    "Leaves",
    "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1000&q=80",
  ],
  [
    "Ocean",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80",
  ],
  [
    "Mountains",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80",
  ],
  [
    "Forest",
    "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=80",
  ],
  [
    "Architecture",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80",
  ],
  [
    "Flowers",
    "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1000&q=80",
  ],
];
export const qrDefaults: Theme = {
  qrShape: "square",
  qrForeground: "#111111",
  qrBackground: "#ffffff",
  qrGradient: "false",
  qrGradientEnd: "#154085",
  qrModule: "square",
  qrEyeShape: "square",
  qrSticker: "none",
  qrCaption: "Scan me",
  qrLogo: "",
  qrPicture: "",
  qrStroke: "",
  qrEye: "",
  qrEyeStroke: "",
  qr3d: "false",
};
export function safeColor(v: string | undefined, fallback: string) {
  return /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v || "") ? v! : fallback;
}
export function safeMedia(v: string | undefined) {
  try {
    const u = new URL(v || "");
    return ["https:", "http:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}
export function numberSetting(
  v: string | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  const n = Number(v);
  return v !== undefined && v !== "" && Number.isFinite(n)
    ? Math.min(max, Math.max(min, n))
    : fallback;
}
export function scopedCss(css: string, scope: string) {
  const allowed = new Set([
    "color",
    "background-color",
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "text-align",
    "text-decoration",
    "line-height",
    "border",
    "border-color",
    "border-width",
    "border-style",
    "border-radius",
    "box-shadow",
    "padding",
    "padding-top",
    "padding-bottom",
    "padding-left",
    "padding-right",
    "margin",
    "margin-top",
    "margin-bottom",
    "gap",
    "opacity",
    "object-fit",
  ]);
  try {
    const root = postcss.parse(css.slice(0, 12000));
    root.walkAtRules((rule) => {
      rule.remove();
    });
    root.walkRules((rule) => {
      if (
        rule.parent?.type !== "root" ||
        rule.selectors.some(
          (s) => !/^([.#]?[a-zA-Z][\w-]*)([ .>#a-zA-Z0-9_-]*)$/.test(s),
        )
      ) {
        rule.remove();
        return;
      }
      rule.selectors = rule.selectors.map((s) =>
        s === ".business-card" ? `.${scope}` : `.${scope} ${s}`,
      );
    });
    root.walkDecls((d) => {
      if (
        !allowed.has(d.prop) ||
        /[\\<>@]|url\s*\(|expression\s*\(/i.test(d.value)
      )
        d.remove();
      else d.important = false;
    });
    return root.toString();
  } catch {
    return "";
  }
}
