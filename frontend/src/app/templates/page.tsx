"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { CardRenderer } from "@/components/CardRenderer";
import { emptyCard, templates } from "@/lib/templates";
import { endpoints } from "@/lib/api";

export default function TemplatesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const categories = ["All", ...Array.from(new Set(templates.map((template) => template.category)))];
  const filtered = useMemo(() => templates.filter((template) => (category === "All" || template.category === category) && `${template.name} ${template.description}`.toLowerCase().includes(query.toLowerCase())), [query, category]);

  useEffect(() => {
    endpoints.me()
      .then(() => setLoggedIn(true))
      .catch(() => setLoggedIn(false))
      .finally(() => setCheckedAuth(true));
  }, []);

  const content = (
    <section className={loggedIn ? "main" : "page"}>
      <div className="section-title">
        <div>
          <h1>Template gallery</h1>
          <p>All 25 templates use one shared profile model and keep your data when switching designs.</p>
        </div>
      </div>
      <div className="toolbar">
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {categories.map((item)=><button className={`step ${item===category?"active":""}`} key={item} onClick={()=>setCategory(item)}>{item}</button>)}
        </div>
        <label className="field" style={{maxWidth:320}}><span><Search size={14}/> Search</span><input className="input" value={query} onChange={(e)=>setQuery(e.target.value)} /></label>
      </div>
      <div className="template-grid">
        {filtered.map((template) => {
          const editorUrl = `/editor/new?template=${template.id}`;
          return (
            <Link className="template-tile" href={loggedIn ? editorUrl : `/login?next=${encodeURIComponent(editorUrl)}`} key={template.id}>
              <div className="template-shot"><CardRenderer compact card={{...emptyCard,templateId:template.id,status:"published",slug:"demo"}} /></div>
              <div className="template-meta"><strong>{template.name}</strong><p>{template.category}</p><small>{template.description}</small></div>
            </Link>
          );
        })}
      </div>
    </section>
  );

  if (!checkedAuth) return null;

  if (loggedIn) {
    return <main className="dashboard-layout"><AppNav/>{content}</main>;
  }

  return (
    <main className="shell">
      <nav className="nav">
        <Link href="/" className="brand"><img src="/TTW-Logo.png" alt="" className="brand-logo"/>TTW card studio</Link>
        <div className="nav-links">
          <Link href="/login">Login</Link>
          <Link className="btn" href="/login?next=%2Feditor%2Fnew">Create card</Link>
        </div>
      </nav>
      {content}
    </main>
  );
}
