"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CardRenderer } from "@/components/CardRenderer";
import { emptyCard, templates } from "@/lib/templates";

export default function TemplatesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const categories = ["All", ...Array.from(new Set(templates.map((template) => template.category)))];
  const filtered = useMemo(() => templates.filter((template) => (category === "All" || template.category === category) && `${template.name} ${template.description}`.toLowerCase().includes(query.toLowerCase())), [query, category]);
  return <main className="shell"><nav className="nav"><Link href="/" className="brand"><span className="brand-mark">C</span>CardStudio</Link><div className="nav-links"><Link href="/dashboard">Dashboard</Link><Link className="btn" href="/editor/new">Create card</Link></div></nav><section className="page"><div className="section-title"><div><h1>Template gallery</h1><p>All 25 templates use one shared profile model and keep your data when switching designs.</p></div></div><div className="toolbar"><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{categories.map((item)=><button className={`step ${item===category?"active":""}`} key={item} onClick={()=>setCategory(item)}>{item}</button>)}</div><label className="field" style={{maxWidth:320}}><span><Search size={14}/> Search</span><input className="input" value={query} onChange={(e)=>setQuery(e.target.value)} /></label></div><div className="template-grid">{filtered.map((template)=><Link className="template-tile" href={`/editor/new?template=${template.id}`} key={template.id}><div className="template-shot"><CardRenderer compact card={{...emptyCard,templateId:template.id,status:"published",slug:"demo"}} /></div><div className="template-meta"><strong>{template.name}</strong><p>{template.category}</p><small>{template.description}</small></div></Link>)}</div></section></main>;
}
