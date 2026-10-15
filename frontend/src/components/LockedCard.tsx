"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { safeMedia } from "@/lib/design";
export type LockedPrompt = {
  locked: true;
  slug: string;
  heading: string;
  description: string;
  label: string;
  button: string;
  image?: string;
};
export function LockedCard({ prompt }: { prompt: LockedPrompt }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="passcode-page">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await api(`/public/cards/${prompt.slug}/unlock`, {
              method: "POST",
              body: JSON.stringify({ passcode: code }),
            });
            router.refresh();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {safeMedia(prompt.image) ? (
          <img src={safeMedia(prompt.image)} alt="" />
        ) : null}
        <h1>{prompt.heading}</h1>
        <p>{prompt.description}</p>
        <label className="field">
          {prompt.label}
          <input
            className="input"
            required
            type="password"
            autoComplete="current-password"
            maxLength={72}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </label>
        {error ? (
          <p role="alert" className="error">
            {error}
          </p>
        ) : null}
        <button className="btn" disabled={busy}>
          {busy ? "Checking..." : prompt.button}
        </button>
      </form>
    </main>
  );
}
