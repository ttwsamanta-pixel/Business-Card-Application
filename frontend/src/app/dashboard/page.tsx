"use client";

import Link from "next/link";
import { Copy, Edit, Eye, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { endpoints, publicCardUrl } from "@/lib/api";
import type { CardProfile } from "@/lib/templates";

export default function DashboardPage() {
  const [cards, setCards] = useState<CardProfile[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const load = () => endpoints.cards().then(setCards).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => cards.filter((card) => `${card.fullName} ${card.company}`.toLowerCase().includes(search.toLowerCase())), [cards, search]);
  const remove = async (id?: string) => {
    if (!id || !confirm("Delete this card permanently?")) return;
    await endpoints.deleteCard(id);
    load();
  };
  const duplicate = async (id?: string) => {
    if (!id) return;
    await endpoints.duplicateCard(id);
    load();
  };
  return <main className="dashboard-layout"><AppNav/><section className="main"><div className="toolbar"><div><h1>Dashboard</h1><p>Manage drafts, published cards, public URLs, and QR downloads.</p></div><Link className="btn" href="/editor/new"><Plus size={16}/> New card</Link></div>{error ? <div className="error">{error}</div> : null}<div className="stat-grid"><div className="panel stat"><strong>{cards.length}</strong>Total cards</div><div className="panel stat"><strong>{cards.filter(c=>c.status==="published").length}</strong>Published</div><div className="panel stat"><strong>{cards.filter(c=>c.status!=="published").length}</strong>Drafts</div><div className="panel stat"><strong>25</strong>Templates</div></div><div className="toolbar" style={{marginTop:22}}><input className="input" style={{maxWidth:360}} placeholder="Search cards..." value={search} onChange={(e)=>setSearch(e.target.value)} /></div><div className="card-list">{filtered.map((card)=><article className="panel" key={card.id}><h3>{card.fullName}</h3><p>{card.company || "No company"} · {card.status}</p><p>{card.slug ? publicCardUrl(card.slug) : "No slug yet"}</p><div className="card-row-actions"><Link className="btn secondary" href={`/editor/${card.id}`}><Edit size={14}/> Edit</Link>{card.status==="published" && card.slug ? <Link className="btn secondary" href={`/card/${card.slug}`}><Eye size={14}/> View</Link> : null}<button className="btn secondary" onClick={()=>duplicate(card.id)}><Copy size={14}/> Duplicate</button><button className="btn danger" onClick={()=>remove(card.id)}><Trash2 size={14}/> Delete</button></div></article>)}</div>{filtered.length===0 ? <div className="panel">No cards found. Create your first QR business card.</div> : null}</section></main>;
}
