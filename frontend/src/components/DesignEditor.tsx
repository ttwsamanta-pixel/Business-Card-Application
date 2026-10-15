"use client";
import { useEffect, useState } from "react";
import { Check, Trash2, Save, X } from "lucide-react";
import { api } from "@/lib/api";
import {
  backgrounds,
  palettes,
  type DesignPreset,
  type Theme,
} from "@/lib/design";
import { useMasters } from "@/lib/masters";
import { ColorField, DesignPanel, MediaUpload, Toggle } from "./DesignControls";
export function DesignEditor({
  theme,
  change,
  onBusy,
}: {
  theme: Theme;
  change: (patch: Theme) => void;
  onBusy: (v: boolean) => void;
}) {
  const { items } = useMasters();
  const [styles, setStyles] = useState<DesignPreset[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key: string, value: string) => change({ [key]: value });
  const text = (key: string, label: string, fallback = "", type = "text") => (
    <label className="field">
      {label}
      <input
        className="input"
        type={type}
        value={theme[key] ?? fallback}
        onChange={(e) => set(key, e.target.value)}
      />
    </label>
  );
  const toggle = (key: string, label: string, defaultValue = false) => (
    <Toggle
      label={label}
      value={theme[key] === undefined ? defaultValue : theme[key] === "true"}
      onChange={(v) => set(key, String(v))}
    />
  );
  const load = () =>
    api<DesignPreset[]>("/design/presets")
      .then(setStyles)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  return (
    <div className="design-editor">
      <DesignPanel title="Background Image" open>
        <MediaUpload
          label="Background image / video"
          video
          value={theme.backgroundMedia || ""}
          onBusy={onBusy}
          onChange={(url, type) =>
            change({ backgroundMedia: url, backgroundMediaType: type })
          }
        />
        <div className="background-options">
          <button
            className={!theme.backgroundMedia ? "selected" : ""}
            title="No background image"
            aria-label="No background image"
            onClick={() => set("backgroundMedia", "")}
          >
            <X />
          </button>
          {backgrounds.map(([label, url]) => (
            <button
              key={label}
              title={label}
              aria-label={`${label} background`}
              aria-pressed={theme.backgroundMedia === url}
              className={theme.backgroundMedia === url ? "selected" : ""}
              onClick={() =>
                change({ backgroundMedia: url, backgroundMediaType: "image" })
              }
            >
              <img src={url} alt={label} />
            </button>
          ))}
        </div>
        <ColorField
          label="Page background color"
          value={theme.background || "#ffffff"}
          onChange={(v) => set("background", v)}
        />
      </DesignPanel>
      <DesignPanel title="Colors">
        <div className="palette-options">
          {palettes.map(([primary, secondary]) => (
            <button
              key={primary}
              aria-label={`Palette ${primary}`}
              aria-pressed={theme.accent === primary}
              style={{
                background: `linear-gradient(${primary} 70%,${secondary} 70%)`,
              }}
              onClick={() => change({ accent: primary, secondary })}
            >
              {theme.accent === primary ? <Check size={18} /> : null}
            </button>
          ))}
        </div>
        <div className="form-grid">
          {[
            ["accent", "Primary Color", "#5278ff"],
            ["secondary", "Secondary Color", "#d7faff"],
            ["profilePrimary", "Primary Profile Text Color", "#ffffff"],
            ["profileSecondary", "Secondary Profile Text Color", "#ffffff"],
            ["textPrimary", "Primary Text Color", "#333333"],
            ["textSecondary", "Secondary Text Color", "#656b6c"],
          ].map(([key, label, fallback]) => (
            <ColorField
              key={key}
              label={label}
              value={theme[key] || fallback}
              onChange={(v) => set(key, v)}
            />
          ))}
        </div>
      </DesignPanel>
      <DesignPanel title="Font Style">
        <div className="font-options">
          <button
            className={!theme.font ? "selected" : ""}
            onClick={() => set("font", "")}
          >
            <X />
            Default
          </button>
          {items
            .filter(
              (i) =>
                i.category === "font" && (i.active || i.value === theme.font),
            )
            .map((i) => (
              <button
                key={i.id}
                className={theme.font === i.value ? "selected" : ""}
                aria-pressed={theme.font === i.value}
                style={{ fontFamily: i.value }}
                onClick={() => set("font", i.value)}
              >
                <strong>Aa</strong>
                <span>{i.label}</span>
              </button>
            ))}
        </div>
      </DesignPanel>
      <DesignPanel title="Card Style">
        {toggle("cardBackground", "Card Background", true)}
        <div className="form-grid">
          <ColorField
            label="Card background color"
            value={theme.panelBackground || "#ffffff"}
            onChange={(v) => set("panelBackground", v)}
          />
          <label className="field">
            Corners: {theme.radius ?? 12}px
            <input
              type="range"
              min="0"
              max="40"
              value={theme.radius ?? 12}
              onChange={(e) => set("radius", e.target.value)}
            />
          </label>
          <ColorField
            label="Drop shadow"
            alpha
            value={theme.shadowColor || "#64646f33"}
            onChange={(v) => set("shadowColor", v)}
          />
          <div className="shadow-inputs">
            {[
              ["shadowX", "X", "0"],
              ["shadowY", "Y", "7"],
              ["shadowBlur", "Blur", "29"],
              ["shadowSpread", "Spread", "0"],
            ].map(([k, l, v]) => (
              <label className="field" key={k}>
                {l}
                <input
                  className="input"
                  type="number"
                  min={k === "shadowBlur" ? 0 : -100}
                  max="100"
                  value={theme[k] ?? v}
                  onChange={(e) => set(k, e.target.value)}
                />
              </label>
            ))}
          </div>
        </div>
      </DesignPanel>
      <DesignPanel title="Page Loader">
        <MediaUpload
          label="Loader"
          value={theme.loaderImage || ""}
          onBusy={onBusy}
          onChange={(url) => set("loaderImage", url)}
        />
      </DesignPanel>
      <DesignPanel title="Page Settings">
        {toggle("pageQr", "Page QR Code", true)}
        {toggle("pageSharing", "Page Sharing Option", true)}
        {toggle("pageMenu", "Landing Page Menu")}
        {toggle("preciseLocation", "Track Precise Location")}
      </DesignPanel>
      <DesignPanel title="Passcode Protection">
        {toggle("passcodeEnabled", "Passcode Protection")}
        {theme.passcodeEnabled === "true" ? (
          <>
            <div className="form-grid">
              <label className="field">
                {theme.hasPasscode === "true"
                  ? "New passcode (leave blank to keep current)"
                  : "Enter the passcode"}
                <input
                  className="input"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  maxLength={72}
                  value={theme.passcode || ""}
                  onChange={(e) => set("passcode", e.target.value)}
                />
              </label>
              <label className="field">
                Session Timeout (minutes)
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="10080"
                  value={theme.passcodeMinutes || "480"}
                  onChange={(e) => set("passcodeMinutes", e.target.value)}
                />
              </label>
            </div>
            {toggle("passcodeImageEnabled", "Passcode Prompt Image")}
            {theme.passcodeImageEnabled === "true" ? (
              <MediaUpload
                label="Passcode prompt image"
                value={theme.passcodeImage || ""}
                onBusy={onBusy}
                onChange={(url) => set("passcodeImage", url)}
              />
            ) : null}
            {text("passcodeHeading", "Heading", "Passcode Protected Page")}
            <label className="field">
              Description
              <textarea
                className="textarea"
                value={
                  theme.passcodeDescription ?? "Enter the passcode to continue."
                }
                onChange={(e) => set("passcodeDescription", e.target.value)}
              />
            </label>
            <div className="form-grid">
              {text("passcodeLabel", "Passcode Input Label", "Enter Passcode")}
              {text("passcodeButton", "Button Label", "Proceed")}
            </div>
          </>
        ) : null}
      </DesignPanel>
      <div className="save-style">
        <input
          className="input"
          aria-label="Style name"
          placeholder="Style name"
          value={name}
          maxLength={120}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="btn secondary"
          disabled={!name.trim() || saving}
          onClick={async () => {
            setSaving(true);
            setError("");
            try {
              await api("/design/presets", {
                method: "POST",
                body: JSON.stringify({
                  name,
                  kind: "style",
                  settings: Object.fromEntries(
                    Object.entries(theme).filter(([k]) => !k.startsWith("qr")),
                  ),
                }),
              });
              await load();
              setName("");
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setSaving(false);
            }
          }}
        >
          <Save size={16} />
          Save this Style
        </button>
      </div>
      <DesignPanel title="Saved Styles">
        {styles
          .filter((s) => s.kind === "style")
          .map((s) => (
            <div className="saved-style" key={s.id}>
              <button
                className="btn secondary"
                onClick={() => change(s.settings)}
              >
                {s.name}
              </button>
              <button
                className="icon-command"
                aria-label={`Delete ${s.name}`}
                title={`Delete ${s.name}`}
                onClick={async () => {
                  try {
                    await api(`/design/presets/${s.id}`, { method: "DELETE" });
                    await load();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
      </DesignPanel>
      <DesignPanel title="Custom CSS">
        <label className="field">
          Custom CSS
          <textarea
            className="textarea custom-css-input"
            spellCheck={false}
            value={theme.customCss || ""}
            maxLength={12000}
            onChange={(e) => set("customCss", e.target.value)}
          />
        </label>
      </DesignPanel>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
