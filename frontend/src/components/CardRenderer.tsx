"use client";

import {
  Mail,
  MapPin,
  Phone,
  QrCode,
  Share2,
  Download,
  Globe,
  Plus,
  X,
} from "lucide-react";
import { useState } from "react";
import type { CardProfile } from "@/lib/templates";
import { templateFor } from "@/lib/templates";
import { publicApiAsset, publicCardUrl } from "@/lib/api";
import { ContentSections, LeadForm } from "./ContentSections";
import { PublicCardDialog } from "./PublicCardDialog";

function cleanUrl(url = "") {
  if (!url) return "";
  return url.startsWith("http") ? url : `https://${url}`;
}

export function CardRenderer({
  card,
  compact = false,
  publicMode = false,
}: {
  card: CardProfile;
  compact?: boolean;
  publicMode?: boolean;
}) {
  const template = templateFor(card.templateId);
  const [dialog, setDialog] = useState<"contact" | "qr" | null>(null);
  const [notice, setNotice] = useState("");
  const lead = card.content?.find((section) => section.enabled && section.type === "lead");
  const contact = card.content?.find((section) => section.enabled && section.type === "contact");
  const downloadContact = () => {
    const link = document.createElement("a");
    link.href = publicApiAsset(`/api/public/cards/${card.slug}/vcard.vcf`);
    link.download = `${card.slug}.vcf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  const addContact = () => {
    setNotice("");
    if (lead) {
      try {
        if (lead.values.once && localStorage.getItem(`ttw-form-${card.id}-${lead.id}`)) {
          downloadContact();
          return;
        }
      } catch {}
      setDialog("contact");
    } else downloadContact();
  };
  const accent = card.theme?.accent || template.accent;
  const avatar =
    card.profileImageUrl ||
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=85";
  const publicUrl = publicCardUrl(card.slug);
  const qrSrc =
    card.status === "published" && card.slug
      ? publicApiAsset(`/api/public/cards/${card.slug}/qr.svg`)
      : "";
  const share = async () => {
    try {
      if (navigator.share)
      await navigator.share({
        title: card.fullName,
        text: card.company || "Digital business card",
        url: publicUrl,
      });
      else {
        await navigator.clipboard.writeText(publicUrl);
        setNotice("Card link copied.");
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError"))
        setNotice("Unable to share. Copy the card address from your browser.");
    }
  };

  return (
    <article
      className={`business-card ${publicMode ? "public-business-card" : ""} ${compact ? "compact" : ""} theme-${template.bg} layout-${template.layout}`}
      style={
        {
          "--accent": accent,
          "--card-radius": `${card.theme?.radius || 12}px`,
          fontFamily: card.theme?.font,
        } as React.CSSProperties
      }
    >
      <div
        className={`card-bg bg-${template.bg}`}
        style={
          card.theme?.background
            ? { background: card.theme.background }
            : undefined
        }
      />
      <div className="card-inner">
        {card.content ? (
          <ContentSections
            card={card}
            compact={compact}
            publicMode={publicMode}
          />
        ) : (
          <>
            {template.layout === "split" ? (
              <div className="split-hero">
                <img src={avatar} alt="" className="split-avatar" />
                <div className="split-copy">
                  <h3>{card.fullName}</h3>
                  <p>{card.designation}</p>
                  <strong>{card.company}</strong>
                </div>
              </div>
            ) : ["cover", "wave"].includes(template.layout) ? (
              <div className="cover-hero">
                <img src={avatar} alt="" className="cover-image" />
                <div className="cover-shade" />
                <div className="cover-copy">
                  <h3>{card.fullName}</h3>
                  <p>{card.designation}</p>
                  <strong>{card.company}</strong>
                </div>
              </div>
            ) : (
              <div className="profile-hero">
                <img src={avatar} alt="" className="avatar" />
                <h3>{card.fullName}</h3>
                <p>{card.designation}</p>
                <strong>{card.company}</strong>
              </div>
            )}

            <div className="quick-actions">
              {card.phone ? (
                <a href={`tel:${card.phone}`} aria-label="Call">
                  <Phone size={compact ? 13 : 16} />
                </a>
              ) : null}
              {card.email ? (
                <a href={`mailto:${card.email}`} aria-label="Email">
                  <Mail size={compact ? 13 : 16} />
                </a>
              ) : null}
              {card.website ? (
                <a href={cleanUrl(card.website)} aria-label="Website">
                  <Globe size={compact ? 13 : 16} />
                </a>
              ) : null}
            </div>

            {card.bio ? (
              <section className="info-card centered">
                <h4>About</h4>
                <p>{card.bio}</p>
              </section>
            ) : null}

            <section className="info-card">
              <h4>Contact</h4>
              {card.phone ? (
                <p>
                  <Phone size={13} />
                  {card.phone}
                </p>
              ) : null}
              {card.email ? (
                <p>
                  <Mail size={13} />
                  {card.email}
                </p>
              ) : null}
              {card.address ? (
                <p>
                  <MapPin size={13} />
                  {card.address}
                </p>
              ) : null}
            </section>

            {card.socialLinks?.length ? (
              <section className="info-card">
                <h4>Social Links</h4>
                {card.socialLinks
                  .filter((link) => link.url)
                  .map((link) => (
                    <a
                      key={`${link.platform}-${link.url}`}
                      className="link-row"
                      href={link.url}
                    >
                      {link.platform}
                      <span>Open</span>
                    </a>
                  ))}
              </section>
            ) : null}
          </>
        )}
        {!publicMode && card.status === "published" && card.slug ? (
          <section className="qr-card">
            <div>
              <h4>
                <QrCode size={16} /> QR Code
              </h4>
              <p>Scan to open this public card.</p>
            </div>
            <img src={qrSrc} alt={`QR for ${card.fullName}`} />
          </section>
        ) : null}

        {publicMode && card.slug ? (
          <nav className="public-card-footer" aria-label="Card actions">
            <button className="footer-icon" onClick={() => setDialog("qr")} aria-label="Show QR code" title="Show QR code">
              <QrCode size={24} />
            </button>
            <button className="footer-icon" onClick={share} aria-label="Share card" title="Share card">
              <Share2 size={24} />
            </button>
            <button className="footer-contact" onClick={addContact}>
              <span>{String(contact?.values.button || "Add to Contact")}</span><Plus size={28} />
            </button>
          </nav>
        ) : null}
        {publicMode && notice ? <div className="public-card-notice" role="status">{notice}</div> : null}
        {publicMode && dialog === "qr" ? <PublicCardDialog label="Card QR code" onClose={() => setDialog(null)}>
          <button className="dialog-close" onClick={() => setDialog(null)} aria-label="Close QR code" title="Close"><X /></button>
          <h2>{card.fullName}</h2>
          <img className="public-qr-image" src={qrSrc} alt={`QR for ${card.fullName}`} />
          <a className="btn" href={publicApiAsset(`/api/public/cards/${card.slug}/qr.png`)} download={`${card.slug}.png`}><Download size={18} /> Download QR</a>
        </PublicCardDialog> : null}
        {publicMode && dialog === "contact" && lead ? <PublicCardDialog label="Share your contact details" className="contact-exchange-dialog" onClose={() => setDialog(null)}>
          <div className="exchange-topbar"><button onClick={() => { setDialog(null); downloadContact(); }}>Skip</button></div>
          {!lead.values.showTitle ? <h2>Share your information with {card.fullName}</h2> : null}
          <LeadForm section={lead} card={card} publicMode contactExchange onSubmitted={() => {
            setDialog(null);
            setNotice(String(lead.values.message || "Thank you for your response."));
            downloadContact();
          }} />
        </PublicCardDialog> : null}
      </div>
    </article>
  );
}
