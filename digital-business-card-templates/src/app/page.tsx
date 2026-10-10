"use client";

import { useMemo, useState } from "react";
import { Search, Check, Eye, Smartphone, Mail, Globe, MapPin, Phone, ChevronRight, Sparkles, SlidersHorizontal, QrCode, Download } from "lucide-react";

type CardData = {
  name: string; role: string; company: string; phone: string; email: string;
  address: string; website: string; about: string; avatar: string; logoText: string;
  socials: { name: string; url: string; short: string }[];
};
type Template = { id: number; name: string; category: string; description: string; bg: string; accent: string; layout: string; badge?: string };

const initialCard: CardData = {
  name: "Ali Halit Diker",
  role: "Journalist",
  company: "Travel And Tour World",
  phone: "+1 914 619 2229",
  email: "pr@travelandtourworld.com",
  address: "244 5th Avenue, Suite 2468, New York, N.Y. 10001",
  website: "www.travelandtourworld.com",
  about: "Stories, ideas and connections from around the world.",
  avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=85",
  logoText: "TTW",
  socials: [
    { name: "Facebook", url: "https://facebook.com", short: "f" },
    { name: "Instagram", url: "https://instagram.com", short: "◎" },
    { name: "X / Twitter", url: "https://x.com", short: "𝕏" },
    { name: "LinkedIn", url: "https://linkedin.com", short: "in" },
    { name: "YouTube", url: "https://youtube.com", short: "▶" },
    { name: "TikTok", url: "https://tiktok.com", short: "♪" }
  ]
};

const templates: Template[] = [
  {id:1,name:"Signature Classic",category:"Classic",description:"Centered portrait, clean white cards and familiar social rows.",bg:"sunset",accent:"#ef4444",layout:"center",badge:"Main reference"},
  {id:2,name:"Soft Pastel",category:"Gradient",description:"Gentle pastel glow with airy spacing and rounded cards.",bg:"pastel",accent:"#e85b70",layout:"center"},
  {id:3,name:"Pure Minimal",category:"Classic",description:"Quiet neutral background with soft elevation.",bg:"white",accent:"#111827",layout:"center"},
  {id:4,name:"Royal Violet",category:"Gradient",description:"Bold violet canvas with crisp white panels.",bg:"violet",accent:"#4c2dbb",layout:"center"},
  {id:5,name:"Wave Editorial",category:"Creative",description:"Editorial cover photo with a flowing wave transition.",bg:"violet",accent:"#ff5964",layout:"wave"},
  {id:6,name:"Midnight Cyan",category:"Dark",description:"Black premium background with cyan highlights.",bg:"black",accent:"#81d1e7",layout:"cover"},
  {id:7,name:"Corporate Navy",category:"Corporate",description:"Deep navy, office imagery and orange accents.",bg:"navy",accent:"#ff862e",layout:"cover"},
  {id:8,name:"Monochrome Luxe",category:"Dark",description:"Textured black mood with monochrome portrait.",bg:"texture",accent:"#f3f4f6",layout:"center"},
  {id:9,name:"Clean Coral",category:"Classic",description:"Bright coral backdrop with simple centered profile.",bg:"coral",accent:"#071744",layout:"center"},
  {id:10,name:"Rose Curve",category:"Creative",description:"Pink canvas and curved cover-photo header.",bg:"rose",accent:"#ed4b58",layout:"wave"},
  {id:11,name:"Emerald Health",category:"Corporate",description:"Deep teal and mint accents for professional services.",bg:"teal",accent:"#4bd4a0",layout:"wave"},
  {id:12,name:"Warm Leather",category:"Premium",description:"Warm brown accents and a refined cover layout.",bg:"white",accent:"#9a4a12",layout:"cover"},
  {id:13,name:"Blue Panel",category:"Gradient",description:"A vibrant blue profile panel against a lilac frame.",bg:"lilac",accent:"#5b8cff",layout:"panel"},
  {id:14,name:"Frosted Glass",category:"Premium",description:"Soft frosted background, grayscale portrait and glassy cards.",bg:"frost",accent:"#111827",layout:"center"},
  {id:15,name:"Goldline Executive",category:"Premium",description:"Navy executive style with gold line details.",bg:"navy",accent:"#ffc21c",layout:"wave"},
  {id:16,name:"Studio Split",category:"Corporate",description:"Split profile header with company color block.",bg:"gray",accent:"#ff5b12",layout:"split"},
  {id:17,name:"Blackout Portrait",category:"Dark",description:"Full portrait fades into a deep black profile card.",bg:"black",accent:"#f4f4f5",layout:"cover"},
  {id:18,name:"Legal Copper",category:"Premium",description:"Minimal white layout with copper typography.",bg:"white",accent:"#9a4b13",layout:"wave"},
  {id:19,name:"Orange Spotlight",category:"Gradient",description:"Navy background and vivid orange hero card.",bg:"navy",accent:"#ff5b12",layout:"photoBottom"},
  {id:20,name:"Coral Mist",category:"Classic",description:"White space, soft shadows and coral accents.",bg:"white",accent:"#f34d59",layout:"cover"},
  {id:21,name:"Citrus Night",category:"Dark",description:"Midnight blue with high-contrast golden details.",bg:"navy",accent:"#ffbe16",layout:"wave"},
  {id:22,name:"Glass Gradient",category:"Gradient",description:"A layered gradient hero with translucent-style panels.",bg:"pastel",accent:"#7056d8",layout:"panel"},
  {id:23,name:"Ocean Professional",category:"Corporate",description:"Ocean teal with a calm mint highlight.",bg:"teal",accent:"#42d6a0",layout:"center"},
  {id:24,name:"Modern Portfolio",category:"Creative",description:"Portfolio-style header with a wide photo and compact bio.",bg:"gray",accent:"#ff6a24",layout:"split"},
  {id:25,name:"Signature Wave Pro",category:"Creative",description:"A polished wave header, prominent logo and bright action buttons.",bg:"rose",accent:"#ef4855",layout:"wave"}
];

const categories = ["All", "Classic", "Gradient", "Corporate", "Creative", "Premium", "Dark"];

function buildVCard(card: CardData) {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${card.name}`,
    `ORG:${card.company}`,
    `TITLE:${card.role}`,
    `TEL;TYPE=CELL:${card.phone}`,
    `EMAIL:${card.email}`,
    `ADR;TYPE=WORK:;;${card.address}`,
    `URL:https://${card.website.replace(/^https?:\/\//, "")}`,
    `NOTE:${card.about}`,
    "END:VCARD"
  ].join("\n");
}

function getQrUrl(card: CardData, size = 180) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=12&data=${encodeURIComponent(buildVCard(card))}`;
}

function Background({bg}:{bg:string}) {
  return <div className={`card-bg bg-${bg}`} aria-hidden="true" />;
}

function Logo({text}:{text:string}) {
  return <div className="brand-logo" aria-label={`${text} logo`}>{text}</div>;
}

function SocialIcon({name, short}:{name:string;short:string}) {
  const cls = name.toLowerCase().replace(/[^a-z]/g,"");
  return <span className={`social-icon social-${cls}`}>{short}</span>;
}

function CardPreview({template, card, compact=false}:{template:Template;card:CardData;compact?:boolean}) {
  const isDark = ["black","navy","teal","violet","coral","sunset","lilac"].includes(template.bg);
  const isCover = ["cover","wave","split","photoBottom","panel"].includes(template.layout);
  const qrUrl = getQrUrl(card, compact ? 120 : 180);
  return (
    <div className={`business-card ${compact ? "compact" : ""} theme-${template.bg} layout-${template.layout}`} style={{"--accent":template.accent} as React.CSSProperties}>
      <Background bg={template.bg}/>
      <div className="card-inner">
        {template.layout === "split" ? (
          <div className="split-hero">
            <img src={card.avatar} alt="" className="split-avatar"/>
            <div className="split-copy"><h3>{card.name}</h3><p>{card.role}</p><strong>{card.company}</strong></div>
          </div>
        ) : template.layout === "photoBottom" ? (
          <>
            <div className="photo-bottom-title"><Logo text={card.logoText}/><h3>{card.name}</h3><p>{card.role}</p><strong>{card.company}</strong></div>
            <div className="photo-bottom-image"><img src={card.avatar} alt="Profile" /></div>
          </>
        ) : isCover ? (
          <div className="cover-hero">
            <img src={card.avatar} alt="Profile" className="cover-image"/>
            <div className="cover-shade"/>
            <div className="cover-logo"><Logo text={card.logoText}/></div>
            <div className="cover-copy"><h3>{card.name}</h3><p>{card.role}</p><strong>{card.company}</strong></div>
          </div>
        ) : (
          <div className="profile-hero">
            <img src={card.avatar} alt="Profile" className="avatar"/>
            <h3>{card.name}</h3><p>{card.role}</p><strong>{card.company}</strong>
          </div>
        )}
        <div className="quick-actions">
          <a href={`tel:${card.phone}`} aria-label="Call"><Phone size={compact?13:16}/></a>
          <a href={`mailto:${card.email}`} aria-label="Email"><Mail size={compact?13:16}/></a>
        </div>
        <div className="about-card">
          <h4>About Me</h4><p>{compact ? "Description" : card.about}</p>
        </div>
        <div className="contact-card">
          <div className="section-title"><Logo text={card.logoText}/><span>Contact Us</span></div>
          <div className="contact-row"><Phone/><div><b>Call Us</b><small>{card.phone}</small></div></div>
          <div className="contact-row"><Mail/><div><b>Email</b><small>{card.email}</small></div></div>
          <div className="contact-row"><Globe/><div><b>Website</b><small>{card.website}</small></div></div>
          <div className="contact-row"><MapPin/><div><b>Address</b><small>{card.address}</small></div></div>
        </div>
        <div className="qr-card">
          <div>
            <h4><QrCode size={compact?14:17}/> Save Contact</h4>
            <p>Scan to add this business card to your phone.</p>
          </div>
          <img src={qrUrl} alt={`QR code for ${card.name}`} loading="lazy"/>
        </div>
        <div className="social-card">
          <h4>Social Links</h4><p>{card.company}</p>
          {card.socials.map(s=><a className="social-row" key={s.name} href={s.url} onClick={e=>e.preventDefault()}><SocialIcon name={s.name} short={s.short}/><span><b>{s.name}</b><small>{s.name==="LinkedIn"?"Connect with us on LinkedIn":s.name==="YouTube"?"Subscribe to our YouTube channel":`Follow us on ${s.name}`}</small></span><ChevronRight size={16}/></a>)}
        </div>
        <div className="web-card"><h4>Web Links</h4><p>{card.company}</p><a className="social-row" href={`https://${card.website}`} onClick={e=>e.preventDefault()}><Logo text={card.logoText}/><span><b>{card.website}</b><small>Visit our website</small></span><ChevronRight size={16}/></a></div>
        <div className="card-footer"><span>✦</span> Get your own page for free!</div>
      </div>
      {!compact && <div className="floating-menu">☰</div>}
    </div>
  );
}

export default function Home() {
  const [selected, setSelected] = useState(1);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const chosen = templates.find(t=>t.id===selected) || templates[0];
  const filtered = useMemo(()=>templates.filter(t=>(activeCategory==="All" || t.category===activeCategory) && `${t.name} ${t.description} ${t.category}`.toLowerCase().includes(search.toLowerCase())),[activeCategory,search]);
  const [card, setCard] = useState<CardData>(initialCard);
  const qrUrl = useMemo(()=>getQrUrl(card, 360),[card]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#"><span className="wordmark-mark">C</span><span>Card<span className="wordmark-light">Studio</span><small>DIGITAL BUSINESS CARDS</small></span></a>
        <div className="topbar-right"><span className="saved-dot"/> Preview workspace <button className="top-cta" onClick={()=>setShowPreview(true)}><Eye size={16}/> Preview selected</button></div>
      </header>
      <section className="page-heading">
        <div><div className="eyebrow"><Sparkles size={15}/> TEMPLATE STUDIO</div><h1>Make your first impression <em>memorable.</em></h1><p>Choose a design, preview your digital business card, and switch styles anytime.</p></div>
        <div className="heading-stat"><strong>25</strong><span>unique templates</span><div className="stat-dots"><i/><i/><i/><i/><i/></div></div>
      </section>
      <div className="workspace">
        <section className="gallery-panel">
          <div className="gallery-head"><div><h2>Choose a template</h2><p>All templates use the same profile details.</p></div><span className="template-count">{filtered.length} templates</span></div>
          <div className="searchbox"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search templates..." aria-label="Search templates"/><SlidersHorizontal size={16}/></div>
          <div className="category-tabs">{categories.map(c=><button key={c} className={activeCategory===c?"active":""} onClick={()=>setActiveCategory(c)}>{c}</button>)}</div>
          <div className="template-grid">
            {filtered.map(t=><button key={t.id} className={`template-tile ${selected===t.id?"selected":""}`} onClick={()=>setSelected(t.id)} aria-pressed={selected===t.id}>
              <div className="tile-preview"><CardPreview template={t} card={card} compact/><span className="tile-overlay"><Eye size={15}/> Preview</span>{selected===t.id&&<span className="selected-check"><Check size={14}/></span>}</div>
              <div className="tile-meta"><span className="tile-number">{String(t.id).padStart(2,"0")}</span><div><strong>{t.name}</strong><small>{t.category}</small></div></div>
              {t.badge&&<span className="reference-badge">{t.badge}</span>}
            </button>)}
          </div>
          {filtered.length===0&&<div className="empty-state">No templates match that search. Try another name or category.</div>}
        </section>
        <aside className="preview-panel">
          <div className="preview-top"><div><span className="live-label"><i/> LIVE PREVIEW</span><h2>{chosen.name}</h2><p>{chosen.description}</p></div><span className="preview-index">{String(chosen.id).padStart(2,"0")} / 25</span></div>
          <div className="preview-device-wrap"><div className="device-frame"><div className="device-speaker"/><div className="device-screen"><CardPreview template={chosen} card={card}/></div><div className="device-home"/></div></div>
          <div className="preview-controls"><div className="selected-template-info"><span className="accent-swatch" style={{background:chosen.accent}}/><div><strong>{chosen.name}</strong><small>{chosen.category} collection</small></div></div><button className="select-button" onClick={()=>setShowPreview(true)}><Check size={16}/> Use this template</button></div>
          <div className="preview-note"><Smartphone size={16}/><span>Responsive design · Preview adapts to mobile screens</span></div>
        </aside>
      </div>
      {showPreview&&<div className="modal-backdrop" onClick={()=>setShowPreview(false)}><div className="preview-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">TEMPLATE PREVIEW</span><h2>{chosen.name}</h2></div><button className="close-modal" onClick={()=>setShowPreview(false)}>×</button></div><div className="modal-body"><div className="modal-card-wrap"><CardPreview template={chosen} card={card}/></div><div className="modal-details"><h3>Template selected</h3><p>{chosen.description}</p><div className="detail-chip">{chosen.category}</div><div className="profile-fields"><label>Preview name<input value={card.name} onChange={e=>setCard({...card,name:e.target.value})}/></label><label>Job title<input value={card.role} onChange={e=>setCard({...card,role:e.target.value})}/></label><label>Company<input value={card.company} onChange={e=>setCard({...card,company:e.target.value})}/></label><label>Phone<input value={card.phone} onChange={e=>setCard({...card,phone:e.target.value})}/></label><label>Email<input value={card.email} onChange={e=>setCard({...card,email:e.target.value})}/></label><label>Website<input value={card.website} onChange={e=>setCard({...card,website:e.target.value})}/></label></div><div className="qr-download-panel"><img src={qrUrl} alt={`QR code for ${card.name}`}/><div><strong>Contact QR</strong><span>Updates as you edit the profile fields.</span><a href={qrUrl} download={`${card.name.replace(/[^a-z0-9]+/gi,"-").toLowerCase()}-qr.png`}><Download size={14}/> Download QR</a></div></div><p className="modal-hint">These are demo details for previewing layouts. Database saving and the account editor will be connected in the next project phase.</p><button className="select-button wide" onClick={()=>setShowPreview(false)}><Check size={16}/> Keep this template selected</button></div></div></div></div>}
      <footer className="app-footer"><span>CardStudio Template Gallery</span><span>Frontend prototype · 25 reusable layouts</span></footer>
    </main>
  );
}
