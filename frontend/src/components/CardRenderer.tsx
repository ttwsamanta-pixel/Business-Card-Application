"use client";

import { Mail, MapPin, Phone, QrCode, Share2, Download, Globe } from "lucide-react";
import type { CardProfile } from "@/lib/templates";
import { templateFor } from "@/lib/templates";
import { publicApiAsset, publicCardUrl } from "@/lib/api";

function cleanUrl(url = "") {
  if (!url) return "";
  return url.startsWith("http") ? url : `https://${url}`;
}

export function CardRenderer({ card, compact = false, publicMode = false }: { card: CardProfile; compact?: boolean; publicMode?: boolean }) {
  const template = templateFor(card.templateId);
  const accent = card.theme?.accent || template.accent;
  const avatar = card.profileImageUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=85";
  const publicUrl = publicCardUrl(card.slug);
  const qrSrc = card.status === "published" && card.slug ? publicApiAsset(`/api/public/cards/${card.slug}/qr.svg`) : "";
  const share = async () => {
    if (navigator.share) await navigator.share({ title: card.fullName, text: card.company || "Digital business card", url: publicUrl });
    else await navigator.clipboard.writeText(publicUrl);
  };

  return (
    <article className={`business-card ${compact ? "compact" : ""} theme-${template.bg} layout-${template.layout}`} style={{ "--accent": accent } as React.CSSProperties}>
      <div className={`card-bg bg-${template.bg}`} />
      <div className="card-inner">
        {template.layout === "split" ? (
          <div className="split-hero"><img src={avatar} alt="" className="split-avatar"/><div className="split-copy"><h3>{card.fullName}</h3><p>{card.designation}</p><strong>{card.company}</strong></div></div>
        ) : ["cover","wave"].includes(template.layout) ? (
          <div className="cover-hero"><img src={avatar} alt="" className="cover-image"/><div className="cover-shade"/><div className="cover-copy"><h3>{card.fullName}</h3><p>{card.designation}</p><strong>{card.company}</strong></div></div>
        ) : (
          <div className="profile-hero"><img src={avatar} alt="" className="avatar"/><h3>{card.fullName}</h3><p>{card.designation}</p><strong>{card.company}</strong></div>
        )}

        <div className="quick-actions">
          {card.phone ? <a href={`tel:${card.phone}`} aria-label="Call"><Phone size={compact ? 13 : 16}/></a> : null}
          {card.email ? <a href={`mailto:${card.email}`} aria-label="Email"><Mail size={compact ? 13 : 16}/></a> : null}
          {card.website ? <a href={cleanUrl(card.website)} aria-label="Website"><Globe size={compact ? 13 : 16}/></a> : null}
        </div>

        {card.bio ? <section className="info-card centered"><h4>About</h4><p>{card.bio}</p></section> : null}

        <section className="info-card">
          <h4>Contact</h4>
          {card.phone ? <p><Phone size={13}/>{card.phone}</p> : null}
          {card.email ? <p><Mail size={13}/>{card.email}</p> : null}
          {card.address ? <p><MapPin size={13}/>{card.address}</p> : null}
        </section>

        {card.socialLinks?.length ? <section className="info-card"><h4>Social Links</h4>{card.socialLinks.filter((link) => link.url).map((link) => <a key={`${link.platform}-${link.url}`} className="link-row" href={link.url}>{link.platform}<span>Open</span></a>)}</section> : null}

        {card.status === "published" && card.slug ? (
          <section className="qr-card">
            <div><h4><QrCode size={16}/> QR Code</h4><p>Scan to open this public card.</p></div>
            <img src={qrSrc} alt={`QR for ${card.fullName}`} />
          </section>
        ) : null}

        {publicMode && card.slug ? (
          <div className="public-actions">
            <button onClick={share}><Share2 size={14}/> Share</button>
            <a href={publicApiAsset(`/api/public/cards/${card.slug}/vcard.vcf`)}><Download size={14}/> vCard</a>
          </div>
        ) : null}
      </div>
    </article>
  );
}
