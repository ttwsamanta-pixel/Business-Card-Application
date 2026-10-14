"use client";

import Link from "next/link";
import { Copy, Download, Edit, Folder, Mail, MoreVertical, MoveRight, Plus, Search, Share2, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { endpoints, publicApiAsset, publicCardUrl } from "@/lib/api";
import type { CardProfile } from "@/lib/templates";

function createdDate(index: number) {
  const day = String(Math.max(1, 7 - index)).padStart(2, "0");
  return `${day}-Oct-2026 16:${String(25 - index).padStart(2, "0")}`;
}

function scanCount(index: number) {
  return [69, 24, 33, 29, 10, 21, 38, 15, 72, 11][index % 10];
}

export default function DashboardPage() {
  const [cards, setCards] = useState<CardProfile[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [error, setError] = useState("");

  const load = () => endpoints.cards().then(setCards).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => cards.filter((card) => {
    const text = `${card.fullName} ${card.company} ${card.slug}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesStatus = status === "All" || card.status === status.toLowerCase();
    return matchesSearch && matchesStatus;
  }), [cards, search, status]);

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

  const totalScans = filtered.reduce((sum, _card, index) => sum + scanCount(index), 0);
  const published = cards.filter((card) => card.status === "published").length;

  return (
    <main className="dashboard-layout qr-admin">
      <AppNav/>
      <section className="main qr-main">
        <div className="qr-page-actions">
          <div>
            <h1>Overview</h1>
          </div>
          <div className="qr-action-row">
            <div className="global-search"><Search size={16}/> Search QR Codes Globally</div>
            <Link className="btn" href="/editor/new"><Plus size={16}/> Create QR Code</Link>
          </div>
        </div>

        {error ? <div className="error">{error}</div> : null}

        <div className="overview-cards">
          <div className="overview-card blue"><span>Total Scans</span><strong>{totalScans}</strong></div>
          <div className="overview-card green"><span>Current Month Scans</span><strong>{Math.min(totalScans, 148)} <small>/ 1000</small></strong></div>
          <div className="overview-card pink"><span>Active Dynamic QR Codes</span><strong>{published} <small>/ 10 ({cards.length} Created)</small></strong></div>
          <div className="overview-card yellow"><span>Static QR Codes</span><strong>0</strong></div>
        </div>

        <section className="qr-section">
          <h2>Folders</h2>
          <div className="folder-card"><Folder size={22}/><div><strong>TTW</strong><span>10-Oct-2026 <b>{cards.length}</b></span></div></div>
        </section>

        <section className="qr-list-panel">
          <div className="qr-list-title">
            <h2>QR Codes List</h2>
            <Link href="/dashboard">Go to Bulk QR Codes</Link>
          </div>
          <div className="qr-filters">
            <label className="qr-search"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search by Name/Short URL/Type"/><Search size={16}/></label>
            <span className="show-count">Show <select><option>10</option></select></span>
            <label>Status:<select value={status} onChange={(e)=>setStatus(e.target.value)}><option>All</option><option>Published</option><option>Draft</option></select></label>
            <label>Type:<select><option>Select Solution Type</option><option>Digital Business Cards</option></select></label>
            <label>Campaign End Date:<input placeholder="dd-----yyyy"/></label>
            <button className="link-button" onClick={()=>{setSearch(""); setStatus("All");}}>Clear All</button>
          </div>

          <div className="qr-table">
            <div className="qr-table-head">
              <span><input type="checkbox"/></span><span>Date</span><span>Name</span><span>Type</span><span>Total Scans</span><span>QR Code</span><span>Action</span>
            </div>
            {filtered.map((card, index) => (
              <div className="qr-table-row" key={card.id || index}>
                <span><input type="checkbox"/></span>
                <span><strong>{createdDate(index)}</strong><small>Created on: {createdDate(index)}<br/>Status: <b className="active-text">{card.status === "published" ? "Active" : "Draft"}</b></small></span>
                <span><strong>{card.fullName} <Edit size={13}/></strong><small>{card.slug ? publicCardUrl(card.slug) : "linko.page/new-card"}<br/><Folder size={13}/> TTW</small></span>
                <span>Dynamic<small>Digital Business<br/>Cards</small></span>
                <span><strong>{scanCount(index)}</strong><Link href={card.id ? `/analytics/${card.id}` : "#"}>View Scan Analytics</Link></span>
                <span>{card.slug ? <img className="qr-thumb" src={publicApiAsset(`/api/public/cards/${card.slug}/qr.png`)} alt="QR"/> : <div className="qr-placeholder">QR</div>}</span>
                <span className="qr-row-actions">
                  {card.slug ? <a href={publicApiAsset(`/api/public/cards/${card.slug}/qr.png`)}><Download size={14}/> Download</a> : <button><Download size={14}/> Download</button>}
                  <button><Sparkles size={14}/> Decorate</button>
                  <Link href={`/editor/${card.id || "new"}`}><Edit size={14}/> Edit</Link>
                  <button onClick={()=>card.id && duplicate(card.id)}><Copy size={14}/> Duplicate</button>
                  <button><MoveRight size={14}/> Move to folder</button>
                  <button><Share2 size={14}/> Share</button>
                  <button><Mail size={14}/> Email Signature</button>
                  <button onClick={()=>remove(card.id)}><Trash2 size={14}/> Delete</button>
                  <MoreVertical size={16}/>
                </span>
              </div>
            ))}
          </div>
          {filtered.length === 0 ? <div className="empty-qr">No QR codes found. Create your first digital business card.</div> : null}
          <div className="qr-pagination"><span>Showing 1 to {Math.min(filtered.length, 10)} of {filtered.length} entries</span><span>Prev <b>1</b> Next</span></div>
        </section>
      </section>
    </main>
  );
}
