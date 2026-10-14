"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { CardRenderer } from "@/components/CardRenderer";
import { endpoints, publicApiAsset, publicCardUrl } from "@/lib/api";
import { emptyCard, templates, type CardProfile } from "@/lib/templates";
import { Briefcase, ChevronRight, Contact, Copy, ExternalLink, Eye, FileText, Globe2, Grid3X3, ImageIcon, Link2, QrCode, Save } from "lucide-react";

const qrTypes = ["URL", "Digital Business Cards", "GS1 QR Code", "Product QR Code", "Multi-URL", "Form QR Code", "PDF to QR Code", "More"];
const colorSwatches = ["#4f7cff","#243b85","#e91e63","#ff8a00","#967040","#46adb5","#09539b","#ff315f","#7b4a30","#ffd21f","#4ade80","#a3c76d","#253cff","#ef4444","#080808","#22c55e","#f7c948"];
const backgrounds = ["#f8fafc","#dbeafe","#fee2e2","#fef3c7","#dcfce7","#f3e8ff","#111827","#fb7185","#38bdf8","#f97316","#facc15","#a78bfa"];
const fonts = ["Default","Work Sans","Open Sans","Roboto","Playfair Display","Josefin Sans","Lato","Concert One","Krona One","Syne","Federo","Courier New","Poppins","Montserrat","Mukta","DM Sans"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="maker-section"><div className="maker-section-head"><strong>{title}</strong><button type="button">-</button></div><div className="maker-section-body">{children}</div></div>;
}

export default function EditorPage() {
  const params = useParams<{ id: string }>();
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [card, setCard] = useState<CardProfile>({...emptyCard, socialLinks: [...emptyCard.socialLinks]});
  const isNew = params.id === "new";

  useEffect(() => {
    if (isNew) {
      const template = new URLSearchParams(window.location.search).get("template");
      if (template) setCard((current) => ({ ...current, templateId: template }));
    }
  }, [isNew]);

  useEffect(() => { if (!isNew) endpoints.card(params.id).then(setCard).catch((err)=>setError(err.message)); }, [isNew, params.id]);

  const set = (patch: Partial<CardProfile>) => setCard((current) => ({ ...current, ...patch }));
  const setTheme = (key: string, value: string) => set({ theme: { ...(card.theme || {}), [key]: value } });

  const save = async (publish = false) => {
    setError(""); setMessage("");
    try {
      const saved = isNew || !card.id ? await endpoints.createCard(card) : await endpoints.updateCard(card.id, card);
      const finalCard = publish ? await endpoints.publishCard(saved.id!) : saved;
      setCard(finalCard);
      setMessage(publish ? "Card published." : "Draft saved.");
      if (isNew) history.replaceState(null, "", `/editor/${finalCard.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const addSocial = () => set({ socialLinks: [...(card.socialLinks || []), { platform: "LinkedIn", url: "https://" }] });

  return (
    <main className="dashboard-layout maker-dashboard">
      <AppNav/>
      <section className="main maker-main">
        <div className="maker-hero">
          <h1>Create Digital Business Cards Online</h1>
          <p>Build a professional digital business card in minutes and share it instantly with a QR code, NFC tap, or link.</p>
        </div>

        {error ? <div className="error">{error}</div> : null}
        {message ? <div className="success">{message}</div> : null}

        <div className="maker-shell">
          <aside className="maker-types">
            {qrTypes.map((item, index) => (
              <button className={item === "Digital Business Cards" ? "active" : ""} key={item}>
                {index === 0 ? <Globe2 size={18}/> : index === 1 ? <Contact size={18}/> : index === 2 ? <QrCode size={18}/> : index === 3 ? <Briefcase size={18}/> : index === 4 ? <Link2 size={18}/> : <FileText size={18}/>}
                {item}
              </button>
            ))}
          </aside>

          <div className="maker-center">
            <div className="maker-title-row">
              <h2>Digital Business Card Maker</h2>
              <label className="maker-toggle"><input type="checkbox"/> Bulk Upload</label>
            </div>
            <div className="maker-steps">
              {[["Content",1],["Design / Settings",2],["QR Code",3]].map(([label, value]) => (
                <button className={step === value ? "active" : ""} key={String(label)} onClick={()=>setStep(Number(value))}><span>{value}</span>{label}<ChevronRight size={16}/></button>
              ))}
            </div>

            <div className="maker-form">
              {step === 1 ? (
                <>
                  <Section title="Page Template">
                    <div className="template-picker">{templates.slice(0, 8).map((template) => <button className={card.templateId === template.id ? "active" : ""} key={template.id} onClick={()=>set({templateId: template.id})}><CardRenderer compact card={{...card, templateId: template.id}}/><span>{template.name}</span></button>)}</div>
                  </Section>
                  <Section title="Profile">
                    <div className="form-grid">
                      <label className="field">Profile image URL<input className="input" value={card.profileImageUrl || ""} onChange={(e)=>set({profileImageUrl:e.target.value})}/></label>
                      <label className="field">Logo URL<input className="input" value={card.logoUrl || ""} onChange={(e)=>set({logoUrl:e.target.value})}/></label>
                      <label className="field">First name<input className="input" value={card.fullName.split(" ")[0] || ""} onChange={(e)=>set({fullName:`${e.target.value} ${card.fullName.split(" ").slice(1).join(" ")}`.trim()})}/></label>
                      <label className="field">Last name<input className="input" value={card.fullName.split(" ").slice(1).join(" ")} onChange={(e)=>set({fullName:`${card.fullName.split(" ")[0] || ""} ${e.target.value}`.trim()})}/></label>
                      <label className="field">Title<input className="input" value={card.designation || ""} onChange={(e)=>set({designation:e.target.value})}/></label>
                      <label className="field">Company<input className="input" value={card.company || ""} onChange={(e)=>set({company:e.target.value})}/></label>
                    </div>
                  </Section>
                  <Section title="Heading + Text">
                    <label className="field">Heading<input className="input" value="About Me" readOnly/></label>
                    <label className="field">Description<textarea className="textarea" value={card.bio || ""} onChange={(e)=>set({bio:e.target.value})}/></label>
                  </Section>
                  <Section title="Contact Us">
                    <div className="form-grid">
                      <label className="field">Phone<input className="input" value={card.phone || ""} onChange={(e)=>set({phone:e.target.value})}/></label>
                      <label className="field">WhatsApp<input className="input" value={card.whatsapp || ""} onChange={(e)=>set({whatsapp:e.target.value})}/></label>
                      <label className="field">Email<input className="input" value={card.email || ""} onChange={(e)=>set({email:e.target.value})}/></label>
                      <label className="field">Website<input className="input" value={card.website || ""} onChange={(e)=>set({website:e.target.value})}/></label>
                      <label className="field" style={{gridColumn:"1/-1"}}>Address<textarea className="textarea" value={card.address || ""} onChange={(e)=>set({address:e.target.value})}/></label>
                      <label className="field" style={{gridColumn:"1/-1"}}>Google Maps URL<input className="input" value={card.mapsUrl || ""} onChange={(e)=>set({mapsUrl:e.target.value})}/></label>
                    </div>
                  </Section>
                  <Section title="Social Links">
                    {card.socialLinks.map((link,index)=><div className="form-grid row-stack" key={index}><input className="input" value={link.platform} onChange={(e)=>{const next=[...card.socialLinks];next[index]={...link,platform:e.target.value};set({socialLinks:next});}}/><input className="input" value={link.url} onChange={(e)=>{const next=[...card.socialLinks];next[index]={...link,url:e.target.value};set({socialLinks:next});}}/></div>)}
                    <button className="btn secondary" type="button" onClick={addSocial}>+ Add Button</button>
                  </Section>
                  <Section title="Appointment + Custom Fields">
                    <div className="form-grid">
                      <label className="field">Button label<input className="input" placeholder="Book an appointment"/></label>
                      <label className="field">URL<input className="input" placeholder="https://"/></label>
                      <label className="field">Custom field name<input className="input" placeholder="Custom label"/></label>
                      <label className="field">Custom field value<input className="input" placeholder="Custom value"/></label>
                    </div>
                  </Section>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <Section title="Background Image">
                    <div className="bg-tile-grid">{backgrounds.map((bg)=><button style={{background:bg}} key={bg} onClick={()=>setTheme("background",bg)}><ImageIcon size={16}/></button>)}</div>
                  </Section>
                  <Section title="Colors">
                    <div className="swatch-grid">{colorSwatches.map((color)=><button style={{background:color}} key={color} onClick={()=>setTheme("accent",color)}/>)}</div>
                    <div className="form-grid"><label className="field">Primary Color<input className="input" value={card.theme?.accent || "#333333"} onChange={(e)=>setTheme("accent",e.target.value)}/></label><label className="field">Secondary Color<input className="input" value={card.theme?.secondary || "#000000"} onChange={(e)=>setTheme("secondary",e.target.value)}/></label></div>
                  </Section>
                  <Section title="Font Style">
                    <div className="font-grid">{fonts.map((font)=><button key={font}><b>Aa</b><small>{font}</small></button>)}</div>
                  </Section>
                  <Section title="Card Style">
                    <div className="form-grid"><label className="field">Background color<input className="input" value="#ffffff"/></label><label className="field">Corners<input className="input" type="range"/></label><label className="field">Drop shadow<input className="input" value="#64646733"/></label><label className="field">Blur<input className="input" value="29"/></label></div>
                  </Section>
                  <Section title="Page Settings">
                    <div className="toggle-list">{["Email me on scan","Page QR Code","Page Sharing Option","Landing Page Menu","AI Business Card Reader","Track Precise Location"].map((item)=><label key={item}>{item}<input type="checkbox" defaultChecked={item !== "Track Precise Location"}/></label>)}</div>
                  </Section>
                  <Section title="Passcode Protection">
                    <div className="form-grid"><label className="field">Enter the passcode<input className="input"/></label><label className="field">Session Timeout<input className="input" value="480"/></label><label className="field" style={{gridColumn:"1/-1"}}>Description<textarea className="textarea" placeholder="This access to this page is protected by a passcode."/></label></div>
                  </Section>
                  <Section title="Custom CSS">
                    <textarea className="textarea css-box"/>
                  </Section>
                </>
              ) : null}

              {step === 3 ? (
                <Section title="Customize QR Code">
                  <div className="qr-custom-grid">
                    {["QR Shapes","Pre-designed","Stickers","Colors","Shapes","Logo","Decorate Picture"].map((item, index)=><button className={index === 0 || index === 3 ? "active" : ""} key={item}><QrCode size={40}/><span>{item}</span></button>)}
                  </div>
                </Section>
              ) : null}
            </div>

            <div className="maker-footer">
              <button className="btn secondary" onClick={()=>setStep(Math.max(1, step - 1))}>Back</button>
              {step < 3 ? <button className="btn" onClick={()=>setStep(step + 1)}>Next</button> : <button className="btn" onClick={()=>save(true)}><Save size={16}/> Save</button>}
            </div>
          </div>

          <aside className="maker-preview">
            <div className="maker-url">{card.slug ? publicCardUrl(card.slug) : "https://linko.page/demo"} <button><Copy size={15}/></button><button><ExternalLink size={15}/></button></div>
            <div className="maker-preview-actions"><button><Eye size={15}/></button><button><Grid3X3 size={15}/></button><button className="btn" onClick={()=>save(false)}>Save</button></div>
            {step === 3 && card.slug ? <div className="qr-big"><img src={publicApiAsset(`/api/public/cards/${card.slug}/qr.png`)} alt="QR"/><a className="btn secondary" href={publicApiAsset(`/api/public/cards/${card.slug}/qr.png`)}>Save & Download</a></div> : <CardRenderer card={card}/>}
          </aside>
        </div>
      </section>
    </main>
  );
}
