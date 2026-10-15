"use client";
import { useEffect, useState } from "react";
import { Menu, MapPin, X } from "lucide-react";
import { api } from "@/lib/api";
import type { CardProfile } from "@/lib/templates";
import {
  fonts,
  safeColor,
  safeMedia,
  scopedCss,
  numberSetting,
} from "@/lib/design";
export function CardDesign({
  card,
  scope,
  publicMode,
}: {
  card: CardProfile;
  scope: string;
  publicMode: boolean;
}) {
  const t = card.theme || {};
  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState(false);
  const [location, setLocation] = useState("");
  useEffect(() => {
    if (!publicMode || !t.loaderImage) return;
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 4000);
    const images = Array.from(
      document.querySelectorAll<HTMLImageElement>(`.${scope} .card-inner img`),
    );
    Promise.allSettled(images.map((i) => i.decode())).then(() =>
      setLoading(false),
    );
    return () => clearTimeout(timer);
  }, [publicMode, t.loaderImage, scope]);
  useEffect(() => {
    if (!publicMode || !card.slug) return;
    const key = `card-visit-${card.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    api(`/public/cards/${card.slug}/visits`, {
      method: "POST",
      body: "{}",
    }).catch(() => {});
  }, [card.id, card.slug, publicMode]);
  const root = `.${scope}`;
  let css = "";
  const rule = (selector: string, property: string, value: string) => {
    css += `${selector}{${property}:${value};}`;
  };
  if (t.profilePrimary)
    rule(
      `${root} .profile-hero h3,${root} .cover-copy h3,${root} .split-copy h3`,
      "color",
      safeColor(t.profilePrimary, "#ffffff"),
    );
  if (t.profileSecondary)
    rule(
      `${root} .profile-hero p,${root} .profile-hero strong,${root} .cover-copy p,${root} .cover-copy strong,${root} .split-copy p,${root} .split-copy strong`,
      "color",
      safeColor(t.profileSecondary, "#ffffff"),
    );
  if (t.textPrimary)
    rule(
      `${root} .info-card h4,${root} .info-card strong,${root} .social-link-row`,
      "color",
      safeColor(t.textPrimary, "#333333"),
    );
  if (t.textSecondary)
    rule(
      `${root} .info-card p,${root} .social-link-row small`,
      "color",
      safeColor(t.textSecondary, "#656b6c"),
    );
  if (t.secondary)
    rule(
      `${root} .quick-actions a`,
      "background-color",
      safeColor(t.secondary, "#ffffff"),
    );
  const panels = `${root} .info-card:not(.transparent-section):not(.social-section),${root} .social-section:not(.transparent-section) .social-link-row,${root} .qr-card`;
  if (t.panelBackground || t.cardBackground)
    rule(
      panels,
      "background",
      t.cardBackground === "false"
        ? "transparent"
        : safeColor(t.panelBackground, "#ffffff"),
    );
  if (t.radius !== undefined)
    rule(panels, "border-radius", `${numberSetting(t.radius, 12, 0, 40)}px`);
  if (t.shadowColor || t.shadowX || t.shadowY || t.shadowBlur || t.shadowSpread)
    rule(
      panels,
      "box-shadow",
      `${numberSetting(t.shadowX, 0, -100, 100)}px ${numberSetting(t.shadowY, 7, -100, 100)}px ${numberSetting(t.shadowBlur, 29, 0, 100)}px ${numberSetting(t.shadowSpread, 0, -100, 100)}px ${safeColor(t.shadowColor, "#64646f33")}`,
    );
  if (t.cardBackground === "false") rule(panels, "box-shadow", "none");
  const media = safeMedia(t.backgroundMedia);
  const font = fonts.includes(t.font) ? t.font : "";
  return (
    <>
      {font &&
      !["Arial", "Georgia", "Verdana", "Tahoma", "Courier New"].includes(
        font,
      ) ? (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, "+")}&display=swap`}
        />
      ) : null}
      <style>{css + scopedCss(t.customCss || "", scope)}</style>
      {media ? (
        t.backgroundMediaType === "video" ? (
          <video
            className="card-background-media"
            src={media}
            autoPlay
            loop
            muted
            playsInline
            aria-hidden="true"
          />
        ) : (
          <img className="card-background-media" src={media} alt="" />
        )
      ) : null}
      {publicMode && loading ? (
        <div
          className="card-page-loader"
          role="status"
          aria-label="Loading card"
        >
          <img src={safeMedia(t.loaderImage)} alt="" />
        </div>
      ) : null}
      {publicMode && t.pageMenu === "true" ? (
        <div className="card-section-menu">
          <button
            className="icon-command"
            aria-label="Card menu"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
          {menu ? (
            <nav aria-label="Card sections">
              {card.content
                ?.filter((s) => s.enabled)
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      document
                        .getElementById(`card-section-${s.id}`)
                        ?.scrollIntoView({ behavior: "smooth" });
                      setMenu(false);
                    }}
                  >
                    {String(s.values.title || s.values.name || s.type)}
                  </button>
                ))}
            </nav>
          ) : null}
        </div>
      ) : null}
      {publicMode && t.preciseLocation === "true" ? (
        <div className="card-location-consent">
          <button
            onClick={() => {
              if (!navigator.geolocation) {
                setLocation("Location is not supported by this browser.");
                return;
              }
              setLocation("Waiting for location permission...");
              navigator.geolocation.getCurrentPosition(
                async (p) => {
                  try {
                    await api(`/public/cards/${card.slug}/visits`, {
                      method: "POST",
                      body: JSON.stringify({
                        consent: true,
                        location: {
                          latitude: p.coords.latitude,
                          longitude: p.coords.longitude,
                          accuracy: p.coords.accuracy,
                        },
                      }),
                    });
                    setLocation("Location shared with the card owner.");
                  } catch {
                    setLocation("Unable to share location.");
                  }
                },
                () => setLocation("Location was not shared."),
                { enableHighAccuracy: true, timeout: 15000 },
              );
            }}
          >
            <MapPin size={15} />
            Share my location with this card owner
          </button>
          {location ? <p role="status">{location}</p> : null}
        </div>
      ) : null}
    </>
  );
}
