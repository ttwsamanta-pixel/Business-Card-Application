"use client";
import { useId, useState } from "react";
import { Plus, Upload, X, Minus } from "lucide-react";
import { uploadImage } from "@/lib/api";
import { safeColor } from "@/lib/design";

export function DesignPanel({
  title,
  children,
  open = false,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details className="design-panel" open={open || undefined}>
      <summary>
        {title}
        <Plus size={18} className="panel-plus" />
        <Minus size={18} className="panel-minus" />
      </summary>
      <div className="design-panel-body">{children}</div>
    </details>
  );
}
export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="design-toggle">
      <span>{label}</span>
      <input
        type="checkbox"
        role="switch"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
export function ColorField({
  label,
  value,
  onChange,
  alpha = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  alpha?: boolean;
}) {
  return (
    <label className="field">
      {label}
      <span className="design-color">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={safeColor(value, "#000000").slice(0, 7)}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          className="input"
          aria-label={label}
          value={value}
          maxLength={alpha ? 9 : 7}
          onChange={(e) => onChange(e.target.value)}
          pattern={
            alpha ? "#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?" : "#[0-9a-fA-F]{6}"
          }
        />
      </span>
    </label>
  );
}
export function MediaUpload({
  label,
  value,
  onChange,
  onBusy,
  video = false,
}: {
  label: string;
  value: string;
  onChange: (url: string, type: string) => void;
  onBusy: (busy: boolean) => void;
  video?: boolean;
}) {
  const id = useId();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="design-upload">
      <span>{label}</span>
      <div>
        {value ? (
          video && /\.(mp4|webm)(\?|$)/i.test(value) ? (
            <video src={value} muted playsInline />
          ) : (
            <img src={value} alt={label} />
          )
        ) : null}
        <label className="icon-command" title={`Upload ${label}`} htmlFor={id}>
          <Upload size={18} />
        </label>
        <input
          id={id}
          className="sr-only"
          type="file"
          aria-label={`Upload ${label}`}
          accept={
            video
              ? "image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
              : "image/png,image/jpeg,image/webp,image/gif"
          }
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setError("");
            setBusy(true);
            onBusy(true);
            try {
              const result = await uploadImage(file);
              onChange(
                result.publicUrl,
                file.type.startsWith("video/") ? "video" : "image",
              );
            } catch (err) {
              setError(err instanceof Error ? err.message : "Upload failed");
            } finally {
              setBusy(false);
              onBusy(false);
            }
          }}
        />
        {value ? (
          <button
            type="button"
            className="icon-command"
            aria-label={`Remove ${label}`}
            title={`Remove ${label}`}
            onClick={() => onChange("", "image")}
          >
            <X size={18} />
          </button>
        ) : null}
      </div>
      {busy ? <span role="status">Uploading...</span> : null}
      {error ? <span role="alert">{error}</span> : null}
    </div>
  );
}
