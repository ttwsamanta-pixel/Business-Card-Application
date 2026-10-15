"use client";
import { useEffect, useState } from "react";
import {
  Circle,
  Heart,
  Hexagon,
  QrCode,
  Shapes,
  Palette,
  Image,
  Frame,
  Sticker,
  X,
  Download,
  RotateCcw,
  Save,
} from "lucide-react";
import { api } from "@/lib/api";
import type { CardProfile } from "@/lib/templates";
import {
  palettes,
  qrDefaults,
  type Theme,
  type DesignPreset,
} from "@/lib/design";
import { ColorField, MediaUpload, Toggle } from "./DesignControls";
import { PublicCardDialog } from "./PublicCardDialog";
const tabs = [
  "QR Shapes",
  "Pre-designed",
  "Stickers",
  "Colors",
  "Shapes",
  "Logos",
  "Decorate Your Picture",
];
const icons = [Circle, QrCode, Sticker, Palette, Shapes, Image, Frame];
export function QrPreview({ card }: { card: CardProfile }) {
  const [src, setSrc] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const settings = JSON.stringify(
    Object.fromEntries(
      Object.entries(card.theme || {}).filter(([key]) => key.startsWith("qr")),
    ),
  );
  useEffect(() => {
    let active = true;
    setBusy(true);
    const timer = setTimeout(() => {
      api<{ dataUrl: string }>("/design/qr", {
        method: "POST",
        body: JSON.stringify({
          slug: card.slug || "",
          theme: JSON.parse(settings),
        }),
      })
        .then((result) => {
          if (active) {
            setSrc(result.dataUrl);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setBusy(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [settings, card.slug]);
  return (
    <div className="qr-live-preview" aria-busy={busy}>
      {src ? <img src={src} alt="QR code preview" /> : <QrCode size={96} />}
      <span role="status">
        {error || (busy ? "Updating QR..." : !card.slug ? "Preview" : "")}
      </span>
    </div>
  );
}
export function QrEditor({
  card,
  change,
  onBusy,
  onSave,
}: {
  card: CardProfile;
  change: (p: Theme) => void;
  onBusy: (v: boolean) => void;
  onSave: () => Promise<CardProfile | undefined>;
}) {
  const [tab, setTab] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preset, setPreset] = useState<DesignPreset>();
  const t = card.theme || {};
  const set = (key: string, v: string) => change({ [key]: v });
  useEffect(() => {
    api<DesignPreset[]>("/design/presets")
      .then((rows) =>
        setPreset(
          rows.find((p) => p.kind === "qr" && p.name === "Default QR design"),
        ),
      )
      .catch((e) => setError(e.message));
  }, []);
  async function download(format: "png" | "svg") {
    setBusy(true);
    setError("");
    try {
      const saved = await onSave();
      if (!saved?.slug) throw new Error("Save your card before downloading.");
      const result = await api<{ dataUrl: string }>("/design/qr", {
        method: "POST",
        body: JSON.stringify({
          slug: saved.slug,
          theme: saved.theme || {},
          format,
        }),
      });
      const a = document.createElement("a");
      a.href = result.dataUrl;
      a.download = `${saved.slug}.${format}`;
      a.click();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const controls = (
    <>
      {tab === "QR Shapes" ? (
        <div className="qr-option-grid">
          {[
            "square",
            "rounded",
            "circle",
            "heart",
            "hexagon",
            "diamond",
            "shield",
          ].map((shape) => (
            <button
              key={shape}
              className={(t.qrShape || "square") === shape ? "selected" : ""}
              aria-pressed={(t.qrShape || "square") === shape}
              onClick={() => set("qrShape", shape)}
            >
              {shape === "heart" ? (
                <Heart size={55} />
              ) : shape === "hexagon" ? (
                <Hexagon size={55} />
              ) : (
                <span className={`qr-shape-icon shape-${shape}`}>
                  <QrCode size={28} />
                </span>
              )}
              {shape}
            </button>
          ))}
        </div>
      ) : null}
      {tab === "Pre-designed" ? (
        <div className="qr-option-grid">
          {[
            ["Classic", "#111111", "square", "square"],
            ["Ocean", "#164e81", "rounded", "dots"],
            ["Forest", "#145c3b", "circle", "rounded"],
            ["Rose", "#a31545", "heart", "square"],
            ["Royal", "#452786", "hexagon", "dots"],
            ["Modern", "#374151", "rounded", "rounded"],
          ].map(([name, color, shape, module]) => (
            <button
              key={name}
              onClick={() =>
                change({
                  ...qrDefaults,
                  qrForeground: color,
                  qrShape: shape,
                  qrModule: module,
                })
              }
            >
              <QrCode size={44} color={color} />
              {name}
            </button>
          ))}
        </div>
      ) : null}
      {tab === "Stickers" ? (
        <>
          <div className="qr-option-grid">
            {["none", "rectangle", "rounded", "pill"].map((v) => (
              <button
                key={v}
                className={(t.qrSticker || "none") === v ? "selected" : ""}
                onClick={() => set("qrSticker", v)}
              >
                <Sticker size={36} />
                {v}
              </button>
            ))}
          </div>
          <label className="field">
            Sticker text
            <input
              className="input"
              maxLength={35}
              value={t.qrCaption || "Scan me"}
              onChange={(e) => set("qrCaption", e.target.value)}
            />
          </label>
        </>
      ) : null}
      {tab === "Colors" ? (
        <>
          <div className="palette-options">
            {palettes.map(([a, b]) => (
              <button
                key={a}
                aria-label={`QR palette ${a}`}
                style={{ background: `linear-gradient(${a} 70%,${b} 70%)` }}
                onClick={() =>
                  change({
                    qrForeground: a,
                    qrGradientEnd: b,
                    qrGradient: "false",
                  })
                }
              />
            ))}
          </div>
          <ColorField
            label="Foreground Color"
            value={t.qrForeground || "#111111"}
            onChange={(v) => set("qrForeground", v)}
          />
          <Toggle
            label="Gradient Color"
            value={t.qrGradient === "true"}
            onChange={(v) => set("qrGradient", String(v))}
          />
          {t.qrGradient === "true" ? (
            <>
              <ColorField
                label="Gradient end color"
                value={t.qrGradientEnd || "#154085"}
                onChange={(v) => set("qrGradientEnd", v)}
              />
              <label className="field">
                Gradient direction
                <select
                  className="select"
                  value={t.qrGradientDirection || "diagonal"}
                  onChange={(e) => set("qrGradientDirection", e.target.value)}
                >
                  <option value="diagonal">Diagonal</option>
                  <option value="vertical">Vertical</option>
                </select>
              </label>
            </>
          ) : null}
          <ColorField
            label="Background Color"
            value={t.qrBackground || "#ffffff"}
            onChange={(v) => set("qrBackground", v)}
          />
          {[
            ["qrStroke", "Custom Stroke Color"],
            ["qrEye", "Custom Eye Color"],
            ["qrEyeStroke", "Custom Eye Stroke Color"],
          ].map(([k, label]) => (
            <div key={k}>
              <Toggle
                label={label}
                value={!!t[k]}
                onChange={(v) => set(k, v ? t.qrForeground || "#111111" : "")}
              />
              {t[k] ? (
                <ColorField
                  label={`${label} value`}
                  value={t[k]}
                  onChange={(v) => set(k, v)}
                />
              ) : null}
            </div>
          ))}
        </>
      ) : null}
      {tab === "Shapes" ? (
        <>
          <label className="field">
            Module shape
            <select
              className="select"
              value={t.qrModule || "square"}
              onChange={(e) => set("qrModule", e.target.value)}
            >
              {["square", "rounded", "dots"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Eye shape
            <select
              className="select"
              value={t.qrEyeShape || "square"}
              onChange={(e) => set("qrEyeShape", e.target.value)}
            >
              <option>square</option>
              <option>rounded</option>
            </select>
          </label>
        </>
      ) : null}
      {tab === "Logos" ? (
        <MediaUpload
          label="QR logo"
          value={t.qrLogo || ""}
          onBusy={onBusy}
          onChange={(url) => set("qrLogo", url)}
        />
      ) : null}
      {tab === "Decorate Your Picture" ? (
        <MediaUpload
          label="QR background picture"
          value={t.qrPicture || ""}
          onBusy={onBusy}
          onChange={(url) => set("qrPicture", url)}
        />
      ) : null}
    </>
  );
  const downloads = (
    <div className="qr-downloads">
      <button className="btn" disabled={busy} onClick={() => download("png")}>
        <Download size={17} />
        {busy ? "Saving..." : "Save & Download PNG"}
      </button>
      <button
        className="btn secondary"
        disabled={busy}
        onClick={() => download("svg")}
      >
        <Download size={17} />
        SVG
      </button>
    </div>
  );
  return (
    <div className="design-editor">
      <h3>Customize QR Code</h3>
      <div className="qr-category-grid">
        {tabs.map((name, i) => {
          const Icon = icons[i];
          return (
            <button key={name} onClick={() => setTab(name)}>
              <Icon size={40} />
              {name}
            </button>
          );
        })}
      </div>
      {downloads}
      {error ? (
        <p role="alert" className="error">
          {error}
        </p>
      ) : null}
      {tab ? (
        <PublicCardDialog
          className="qr-custom-dialog"
          label="Customize QR Code"
          onClose={() => setTab(null)}
        >
          <header>
            <h2>Customize QR Code</h2>
            <button
              className="icon-command"
              title="Close QR customization"
              aria-label="Close QR customization"
              onClick={() => setTab(null)}
            >
              <X />
            </button>
          </header>
          <div className="qr-tabs" role="tablist">
            {tabs.map((name) => (
              <button
                key={name}
                role="tab"
                aria-selected={tab === name}
                onClick={() => setTab(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="qr-custom-layout">
            <div className="qr-control-panel" role="tabpanel">
              {controls}
            </div>
            <div>
              <QrPreview card={card} />
              <Toggle
                label="Add 3D Effect"
                value={t.qr3d === "true"}
                onChange={(v) => set("qr3d", String(v))}
              />
              <div className="qr-default-actions">
                <button
                  className="btn secondary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const fresh = await api<DesignPreset>("/design/presets", {
                        method: "POST",
                        body: JSON.stringify({
                          name: "Default QR design",
                          kind: "qr",
                          settings: Object.fromEntries(
                            Object.entries(t).filter(([k]) =>
                              k.startsWith("qr"),
                            ),
                          ),
                        }),
                      });
                      if (preset)
                        await api(`/design/presets/${preset.id}`, {
                          method: "DELETE",
                        });
                      setPreset(fresh);
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Save size={15} />
                  Set as default
                </button>
                <button
                  className="btn secondary"
                  disabled={!preset}
                  onClick={() => change({ ...qrDefaults, ...preset?.settings })}
                >
                  Apply default
                </button>
                <button
                  className="btn secondary"
                  onClick={() => change(qrDefaults)}
                >
                  <RotateCcw size={15} />
                  Reset
                </button>
              </div>
              {downloads}
              {error ? (
                <p role="alert" className="error">
                  {error}
                </p>
              ) : null}
            </div>
          </div>
        </PublicCardDialog>
      ) : null}
    </div>
  );
}
