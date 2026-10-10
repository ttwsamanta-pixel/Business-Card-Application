"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { CardRenderer } from "@/components/CardRenderer";
import { endpoints, publicApiAsset, publicCardUrl } from "@/lib/api";
import { emptyCard, templates, type CardProfile } from "@/lib/templates";

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
  return <main className="dashboard-layout"><AppNav/><section className="main"><div className="toolbar"><div><h1>Card editor</h1><p>Step through profile details, design, QR, and publishing.</p></div><Link className="btn secondary" href="/dashboard">Back</Link></div>{error ? <div className="error">{error}</div> : null}{message ? <div className="success">{message}</div> : null}<div className="steps">{[1,2,3].map((item)=><button key={item} className={`step ${step===item?"active":""}`} onClick={()=>setStep(item)}>Step {item}</button>)}</div><div className="editor"><div className="panel">{step===1 ? <div className="form-grid"><label className="field">Full name<input className="input" value={card.fullName} onChange={(e)=>set({fullName:e.target.value})}/></label><label className="field">Designation<input className="input" value={card.designation || ""} onChange={(e)=>set({designation:e.target.value})}/></label><label className="field">Company<input className="input" value={card.company || ""} onChange={(e)=>set({company:e.target.value})}/></label><label className="field">Email<input className="input" value={card.email || ""} onChange={(e)=>set({email:e.target.value})}/></label><label className="field">Phone<input className="input" value={card.phone || ""} onChange={(e)=>set({phone:e.target.value})}/></label><label className="field">WhatsApp<input className="input" value={card.whatsapp || ""} onChange={(e)=>set({whatsapp:e.target.value})}/></label><label className="field">Website<input className="input" value={card.website || ""} onChange={(e)=>set({website:e.target.value})}/></label><label className="field">Maps URL<input className="input" value={card.mapsUrl || ""} onChange={(e)=>set({mapsUrl:e.target.value})}/></label><label className="field" style={{gridColumn:"1/-1"}}>Address<textarea className="textarea" value={card.address || ""} onChange={(e)=>set({address:e.target.value})}/></label><label className="field" style={{gridColumn:"1/-1"}}>Short biography<textarea className="textarea" value={card.bio || ""} onChange={(e)=>set({bio:e.target.value})}/></label></div> : null}{step===2 ? <div><div className="form-grid"><label className="field">Profile photo URL<input className="input" value={card.profileImageUrl || ""} onChange={(e)=>set({profileImageUrl:e.target.value})}/></label><label className="field">Logo URL<input className="input" value={card.logoUrl || ""} onChange={(e)=>set({logoUrl:e.target.value})}/></label><label className="field">Accent color<input className="input" type="color" value={card.theme?.accent || "#305cff"} onChange={(e)=>set({theme:{...(card.theme||{}),accent:e.target.value}})}/></label><label className="field">Template<select className="select" value={card.templateId} onChange={(e)=>set({templateId:e.target.value})}>{templates.map((template)=><option value={template.id} key={template.id}>{template.name}</option>)}</select></label></div><h3>Social links</h3>{card.socialLinks.map((link,index)=><div className="form-grid" key={index} style={{marginBottom:8}}><input className="input" value={link.platform} onChange={(e)=>{const next=[...card.socialLinks];next[index]={...link,platform:e.target.value};set({socialLinks:next});}}/><input className="input" value={link.url} onChange={(e)=>{const next=[...card.socialLinks];next[index]={...link,url:e.target.value};set({socialLinks:next});}}/></div>)}<button className="btn secondary" onClick={addSocial}>Add social link</button></div> : null}{step===3 ? <div><h2>Publish and QR</h2><p>Status: {card.status || "draft"}</p>{card.status==="published" && card.slug ? <><p><a href={publicCardUrl(card.slug)}>{publicCardUrl(card.slug)}</a></p><p><a className="btn secondary" href={publicApiAsset(`/api/public/cards/${card.slug}/qr.png`)}>Download QR</a> <a className="btn secondary" href={publicApiAsset(`/api/public/cards/${card.slug}/vcard.vcf`)}>Download vCard</a></p></> : <p>Save and publish the card to generate a public URL and QR code.</p>}</div> : null}<div className="card-row-actions"><button className="btn secondary" onClick={()=>save(false)}>Save draft</button><button className="btn" onClick={()=>save(true)}>Publish</button>{card.id && card.status==="published" ? <button className="btn secondary" onClick={async()=>{const updated=await endpoints.unpublishCard(card.id!);setCard(updated);}}>Unpublish</button> : null}</div></div><div className="editor-preview"><CardRenderer card={card}/></div></div></section></main>;
}
