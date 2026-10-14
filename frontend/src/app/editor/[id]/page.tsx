"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { CardRenderer } from "@/components/CardRenderer";
import { endpoints, publicApiAsset, publicCardUrl } from "@/lib/api";
import { emptyCard, templates, type CardProfile } from "@/lib/templates";
import { ChevronLeft, ChevronRight, Copy, ExternalLink, Eye, GripVertical, Grid3X3, ImageIcon, Plus, QrCode, Save, Trash2, Upload } from "lucide-react";

const colorSwatches = ["#4f7cff","#243b85","#e91e63","#ff8a00","#967040","#46adb5","#09539b","#ff315f","#7b4a30","#ffd21f","#4ade80","#a3c76d","#253cff","#ef4444","#080808","#22c55e","#f7c948"];
const backgrounds = ["#f8fafc","#dbeafe","#fee2e2","#fef3c7","#dcfce7","#f3e8ff","#111827","#fb7185","#38bdf8","#f97316","#facc15","#a78bfa"];
const fonts = ["Default","Work Sans","Open Sans","Roboto","Playfair Display","Josefin Sans","Lato","Concert One","Krona One","Syne","Federo","Courier New","Poppins","Montserrat","Mukta","DM Sans"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="maker-section"><div className="maker-section-head"><strong>{title}</strong><button type="button">-</button></div><div className="maker-section-body">{children}</div></div>;
}

function Toggle({ checked = true }: { checked?: boolean }) {
  return <span className={`ref-toggle ${checked ? "on" : ""}`}><i/></span>;
}

function ComponentHeader({ title, open = true, enabled = true, hint }: { title: string; open?: boolean; enabled?: boolean; hint?: string }) {
  return (
    <div className="ref-component-head">
      <span className="drag"><GripVertical size={15}/></span>
      <div><strong>{title}</strong>{hint ? <small>{hint}</small> : null}</div>
      <Toggle checked={enabled}/>
      <button type="button">{open ? "-" : <Plus size={18}/>}</button>
    </div>
  );
}

function UploadBox({ image, label = "1:1 Ratio" }: { image?: string; label?: string }) {
  return <div className="upload-row">{image ? <img src={image} alt=""/> : <span><Upload size={18}/></span>}<button type="button"><Upload size={18}/></button><small>{label}</small></div>;
}

function ItemActions() {
  return <div className="item-actions"><button type="button"><Trash2 size={14}/></button><button type="button"><GripVertical size={14}/></button></div>;
}

function RefPanel({ children }: { children: React.ReactNode }) {
  return <div className="ref-panel"><ItemActions/>{children}</div>;
}

export default function EditorPage() {
  const params = useParams<{ id: string }>();
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [card, setCard] = useState<CardProfile>({...emptyCard, socialLinks: [...emptyCard.socialLinks]});
  const templateScroller = useRef<HTMLDivElement>(null);
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
  const scrollTemplates = (direction: number) => {
    templateScroller.current?.scrollBy({ left: direction * 260, behavior: "smooth" });
  };

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
                  <div className="page-url-block">
                    <label>Your Page URL <small>(Once saved, cannot be changed later)</small></label>
                    <div><span>linko.page/</span><input className="input" value={card.slug || "new-card"} readOnly/></div>
                  </div>

                  <div className="template-block">
                    <h3>Page Template <small>(Click on the template you like)</small></h3>
                    <div className="template-carousel">
                      <button className="template-nav" type="button" aria-label="Previous templates" onClick={()=>scrollTemplates(-1)}><ChevronLeft size={20}/></button>
                      <div className="template-picker" ref={templateScroller}>{templates.map((template) => <button className={card.templateId === template.id ? "active" : ""} key={template.id} onClick={()=>set({templateId: template.id})}><CardRenderer compact card={{...card, templateId: template.id}}/><span>{template.name}</span></button>)}</div>
                      <button className="template-nav" type="button" aria-label="Next templates" onClick={()=>scrollTemplates(1)}><ChevronRight size={20}/></button>
                    </div>
                  </div>

                  <section className="ref-component">
                    <ComponentHeader title="Profile"/>
                    <div className="ref-body">
                      <div className="media-grid">
                        <label>Profile Photo <Toggle checked={false}/><UploadBox image={card.profileImageUrl}/><small>(500x625px, 4:5 Ratio)</small></label>
                        <label>Brand Logo <Toggle/><UploadBox image={card.logoUrl || "/TTW-Logo.png"}/><small>(120x120px, 1:1 Ratio)</small></label>
                      </div>
                      <label className="field wide">Name<input className="input" value={card.fullName} onChange={(e)=>set({fullName:e.target.value})}/></label>
                      <div className="form-grid">
                        <label className="field">Heading<input className="input" value={card.designation || ""} onChange={(e)=>set({designation:e.target.value})}/></label>
                        <label className="field">Sub Heading<input className="input" value={card.company || ""} onChange={(e)=>set({company:e.target.value})}/></label>
                      </div>
                      <div className="inline-label">Profile Connect Icons <Toggle/></div>
                      <RefPanel><div className="split-input"><select className="select"><option>Mobile</option><option>WhatsApp</option></select><input className="input" value={card.phone || ""} onChange={(e)=>set({phone:e.target.value})}/></div></RefPanel>
                      <RefPanel><div className="split-input"><select className="select"><option>Email</option></select><input className="input" value={card.email || ""} onChange={(e)=>set({email:e.target.value})}/></div></RefPanel>
                      <button className="outline-action" type="button"><Plus size={15}/> Add More</button>
                    </div>
                  </section>

                  <section className="ref-component">
                    <ComponentHeader title="Heading + Text"/>
                    <div className="ref-body">
                      <label className="field">Title<input className="input" defaultValue="About Me"/></label>
                      <label className="field">Description<textarea className="textarea tall" value={card.bio || ""} onChange={(e)=>set({bio:e.target.value})}/></label>
                      <div className="component-foot"><Toggle/> Card Background</div>
                    </div>
                  </section>

                  <section className="ref-component">
                    <ComponentHeader title="Contact Us"/>
                    <div className="ref-body">
                      <label className="field">Title<input className="input" defaultValue="Contact Us"/></label>
                      <div className="inline-label">Contact Icon <Toggle/><UploadBox image="/TTW-Logo.png"/></div>
                      <div className="inline-label">Floating button <Toggle/></div>
                      <div className="floating-button-row"><label className="field">Button Text<input className="input" defaultValue="Add to Contact"/></label><button type="button">Add to Contact <Plus size={18}/></button></div>
                      <div className="inline-label">Auto-Save Contact <Toggle checked={false}/> Contact Exchange Form <Toggle/></div>
                      <RefPanel><div className="form-grid"><label className="field">Label<input className="input" defaultValue="Call Us"/></label><label className="field">Number<input className="input" value={card.phone || ""} onChange={(e)=>set({phone:e.target.value})}/></label></div></RefPanel>
                      <RefPanel><div className="form-grid"><label className="field">Label<input className="input" defaultValue="Email"/></label><label className="field">Email<input className="input" value={card.email || ""} onChange={(e)=>set({email:e.target.value})}/></label></div></RefPanel>
                      <RefPanel><div className="form-grid"><label className="field wide">Label<input className="input" defaultValue="Address"/></label><label className="field">Address Line 1<input className="input" value={card.address || ""} onChange={(e)=>set({address:e.target.value})}/></label><label className="field">Address Line 2<input className="input"/></label><label className="field">City<input className="input"/></label><label className="field">State<input className="input"/></label><label className="field">Country<input className="input"/></label><label className="field">Zipcode<input className="input"/></label><label className="field">Action Button <Toggle checked={false}/><input className="input" defaultValue="Direction"/></label><label className="field">Google Map URL<input className="input" value={card.mapsUrl || ""} onChange={(e)=>set({mapsUrl:e.target.value})}/></label></div></RefPanel>
                      <button className="outline-action" type="button"><Plus size={15}/> Add</button>
                      <div className="component-foot"><Toggle/> Save e-business card link into contacts</div>
                      <div className="component-foot"><Toggle/> Card Background</div>
                    </div>
                  </section>

                  <section className="ref-component">
                    <ComponentHeader title="Images" enabled={false}/>
                    <div className="ref-body">
                      <div className="inline-label">Title, Description <Toggle checked={false}/></div>
                      <div className="view-type-row"><button className="active">List</button><button>Grid 1</button><button>Grid 2</button></div>
                      <label className="field">Photos <small>(600x600px, 1:1 or 4:5 Ratio)</small></label>
                      <div className="photo-strip"><UploadBox image="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=160&q=80"/><UploadBox image="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=160&q=80"/><UploadBox/></div>
                      <div className="component-foot"><Toggle/> Card Background</div>
                    </div>
                  </section>

                  <section className="ref-component">
                    <ComponentHeader title="Social Links"/>
                    <div className="ref-body">
                      <div className="inline-label">Title, Description <Toggle/></div>
                      <RefPanel><label className="field">Title<input className="input" defaultValue="Social Links"/></label><label className="field">Description<textarea className="textarea" defaultValue="Travel And Tour World"/></label></RefPanel>
                      {card.socialLinks.map((link,index)=><RefPanel key={index}><div className="social-line"><select className="select" value={link.platform} onChange={(e)=>{const next=[...card.socialLinks];next[index]={...link,platform:e.target.value};set({socialLinks:next});}}><option>Facebook</option><option>Instagram</option><option>LinkedIn</option><option>Twitter</option><option>YouTube</option><option>TikTok</option></select><input className="input" value={link.url} onChange={(e)=>{const next=[...card.socialLinks];next[index]={...link,url:e.target.value};set({socialLinks:next});}}/></div><div className="form-grid"><UploadBox label="1:1 Ratio"/><label className="field">Title<input className="input" value={link.platform} readOnly/></label><label className="field">Subtitle <Toggle/><input className="input" defaultValue={`Follow us on ${link.platform}`}/></label></div></RefPanel>)}
                      <button className="outline-action" type="button" onClick={addSocial}><Plus size={15}/> Add Link</button>
                      <div className="component-foot"><Toggle/> Card Background</div>
                    </div>
                  </section>

                  <section className="ref-component">
                    <ComponentHeader title="Links"/>
                    <div className="ref-body">
                      <div className="inline-label">Title, Description <Toggle/></div>
                      <RefPanel><label className="field">Title<input className="input" defaultValue="Web Links"/></label><label className="field">Description<textarea className="textarea" defaultValue="Travel And Tour World"/></label></RefPanel>
                      {[card.website || "https://www.travelandtourworld.com/", ""].map((url,index)=><RefPanel key={index}><label className="field">Link<input className="input" value={url} readOnly={index !== 0} onChange={(e)=>index===0 && set({website:e.target.value})}/></label><div className="form-grid"><UploadBox image={index === 0 ? "/TTW-Logo.png" : undefined}/><label className="field">Title<input className="input" defaultValue={index === 0 ? "www.travelandtourworld.com" : "Title"}/></label><label className="field">Subtitle <Toggle checked={false}/><input className="input" placeholder="Sub Title"/></label></div></RefPanel>)}
                      <button className="outline-action" type="button"><Plus size={15}/> Add Link</button>
                      <div className="component-foot"><Toggle/> Card Background</div>
                    </div>
                  </section>

                  <section className="ref-component">
                    <ComponentHeader title="Appointment/Calendar" enabled={false}/>
                    <div className="ref-body">
                      <div className="inline-label">Title, Description <Toggle/></div>
                      <RefPanel><label className="field">Title<input className="input" defaultValue="Schedule Meeting"/></label><label className="field">Description<textarea className="textarea" defaultValue="Schedule a meeting to discuss potential opportunities for collaboration"/></label></RefPanel>
                      {["Book on Calendly","Add to Calendar"].map((label)=><RefPanel key={label}><label className="field">URL<input className="input" placeholder="Your URL"/></label><label className="field">Button Label<input className="input" defaultValue={label}/></label></RefPanel>)}
                      <button className="outline-action" type="button"><Plus size={15}/> Add More Link</button>
                      <div className="component-foot"><Toggle/> Card Background</div>
                    </div>
                  </section>

                  <section className="ref-component">
                    <ComponentHeader title="Lead Collection (Collect Contacts)" enabled={false} hint="Enable this feature to collect your prospect's contact details"/>
                    <div className="ref-body lead-body">
                      <label className="field">Form Name <input className="input" defaultValue="Contact Collection"/></label>
                      <div className="ref-panel"><strong>Template</strong><div className="radio-row"><label><input type="radio" defaultChecked/> Create New</label><label><input type="radio"/> Use Form Template</label></div></div>
                      <div className="ref-panel"><strong>Form Settings</strong><div className="view-type-row"><button className="active">Overlay</button><button>Inline</button></div><div className="inline-label">Allow to dismiss form <Toggle/> Size <label><input type="radio" defaultChecked/> Full Screen</label><label><input type="radio"/> Popup</label></div><div className="inline-label">Show Form <label><input type="radio"/> On Scroll</label><label><input type="radio" defaultChecked/> After Delay</label><label><input type="radio"/> On Click</label></div><label className="field">Delay Time<input className="input small-input" defaultValue="1"/></label></div>
                      <div className="ref-panel"><strong>Form Content</strong><div className="media-grid"><label>Header Image <Toggle/><UploadBox/></label></div><label className="field">Title<input className="input" defaultValue="Hi, great to connect with you!"/></label><label className="field">Description<textarea className="textarea" defaultValue="Please provide the information below to proceed further"/></label>{[["Your Name","One-Line"],["Your Email","Email"],["Your Phone","Phone"]].map(([label,type])=><RefPanel key={label}><div className="form-grid"><label className="field">Label/Question<input className="input" defaultValue={label}/></label><label className="field">Type<select className="select" defaultValue={type}><option>One-Line</option><option>Email</option><option>Phone</option></select></label><label><input type="checkbox" defaultChecked/> Required</label><label className="field wide">Error Message<input className="input" defaultValue="This field is required"/></label></div></RefPanel>)}<button className="outline-action" type="button"><Plus size={15}/> Add</button><label className="field">Footer description<textarea className="textarea"/></label><label className="field">Button Label<input className="input" defaultValue="Submit"/></label></div>
                      <div className="ref-panel"><strong>Completion Message</strong><div className="radio-row"><label><input type="radio" defaultChecked/> Toast</label><label><input type="radio"/> Popup</label></div><label className="field">Description<textarea className="textarea" defaultValue="Thank you for your response."/></label></div>
                      <div className="ref-panel"><strong>Form Integration Settings</strong>{["Invoke API","Invoke SMS","Hubspot","Salesforce"].map((item)=><p className="integration-row" key={item}>{item}<Toggle checked={false}/></p>)}</div>
                      <button className="outline-action" type="button">Save As Template</button>
                      <label><input type="checkbox"/> Email me on Form Submission</label>
                      <div className="component-foot"><Toggle/> Card Background</div>
                    </div>
                  </section>

                  <div className="add-component-row"><button className="btn" type="button"><Plus size={16}/> Add Component</button></div>
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
                    <div className="form-grid"><label className="field">Background color<input className="input" value="#ffffff" readOnly/></label><label className="field">Corners<input className="input" type="range" readOnly/></label><label className="field">Drop shadow<input className="input" value="#64646733" readOnly/></label><label className="field">Blur<input className="input" value="29" readOnly/></label></div>
                  </Section>
                  <Section title="Page Settings">
                    <div className="toggle-list">{["Email me on scan","Page QR Code","Page Sharing Option","Landing Page Menu","AI Business Card Reader","Track Precise Location"].map((item)=><label key={item}>{item}<input type="checkbox" defaultChecked={item !== "Track Precise Location"}/></label>)}</div>
                  </Section>
                  <Section title="Passcode Protection">
                    <div className="form-grid"><label className="field">Enter the passcode<input className="input"/></label><label className="field">Session Timeout<input className="input" value="480" readOnly/></label><label className="field" style={{gridColumn:"1/-1"}}>Description<textarea className="textarea" placeholder="This access to this page is protected by a passcode."/></label></div>
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
