"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { LocationHistory } from '@/components/LocationHistory';
import { endpoints, publicApiAsset, publicCardUrl } from "@/lib/api";
import type { CardProfile } from "@/lib/templates";
import { ArrowLeft, CalendarDays, Globe2, Link2, Share2 } from "lucide-react";

const days = ["24-Sep","25-Sep","26-Sep","27-Sep","28-Sep","02-Oct","03-Oct","07-Oct","08-Oct","09-Oct"];
const bars = [3,16,23,3,2,1,1,7,10,2];
const links = [
  ["https://www.instagram.com/travelandtourworld", 8],
  ["https://www.travelandtourworld.com/", 6],
  ["https://www.facebook.com/ttwemagazine/", 5],
  ["https://www.youtube.com/@TravelAndTourWorld", 5],
  ["tel:+817040102761", 3],
  ["mailto:info@jemluza.com", 2]
];

function MiniBars({ values = bars }: { values?: number[] }) {
  return <div className="mini-bars">{values.map((value, index)=><div key={index}><i style={{height:`${value * 5}px`}}/><b style={{height:`${Math.max(8, value * 4)}px`}}/><span>{days[index] || index}</span></div>)}</div>;
}

function Donut({ label, color = "#4f7cff" }: { label: string; color?: string }) {
  return <div className="donut-wrap"><div className="donut" style={{background:`conic-gradient(${color} 0 68%, #6b7280 68% 97%, #ef4444 97%)`}}/><span>{label}</span></div>;
}

export default function AnalyticsPage() {
  const params = useParams<{ id: string }>();
  const [card, setCard] = useState<CardProfile>();
  const [error, setError] = useState("");

  useEffect(() => { endpoints.card(params.id).then(setCard).catch((err)=>setError(err.message)); }, [params.id]);

  return (
    <main className="dashboard-layout">
      <AppNav/>
      <section className="main analytics-main">
        <Link className="back-link" href="/dashboard"><ArrowLeft size={16}/> {card?.fullName || "Analytics"}</Link>
        {error ? <div className="error">{error}</div> : null}

        <section className="analytics-card hero-card">
          <div>
            <strong>digital-business-cards</strong>
            <p><CalendarDays size={14}/> 24th September 2026</p>
            <p><Link2 size={14}/> {card?.slug ? publicCardUrl(card.slug) : "https://linko.page/demo"}</p>
            <p>Campaign Start Date <a>Set Date</a> End Date <a>Set Date</a></p>
            <button className="share-toggle"><Share2 size={15}/> Share <span/></button>
          </div>
          {card?.slug ? <img className="analytics-qr" src={publicApiAsset(`/api/public/cards/${card.slug}/qr.png`)} alt="QR"/> : <div className="analytics-qr placeholder">QR</div>}
        </section>

        <div className="analytics-filters"><span><Globe2 size={14}/> Asia/Kolkata</span><span>Form Data</span><button>September 10 - October 9 v</button></div>

        <div className="analytics-stats">
          {[["68","Total Scans"],["49","Unique Scans"],["0","Forms Submitted"],["33","Links Clicked"],["9","Contact Saved"]].map(([value,label])=><div className="analytics-stat" key={label}><strong>{value}</strong><span>{label}</span></div>)}
        </div>

        <section className="analytics-card"><h3>Timeline Analysis</h3><MiniBars/></section>
        <div className="analytics-two">
          <section className="analytics-card"><h3>Hour-Wise Analysis</h3><MiniBars values={[1,1,1,9,9,1,3,7,4,8,1,4,7,3,6,1]}/></section>
          <section className="analytics-card"><h3>Day-Wise Analysis</h3><MiniBars values={[3,2,7,13,19,24]}/></section>
        </div>
        <div className="analytics-two">
          <section className="analytics-card"><h3>Device Analysis</h3><Donut label="iPhone 68%"/></section>
          <section className="analytics-card"><h3>Browser Analysis</h3><Donut label="Apple Safari 62%" color="#22c55e"/></section>
        </div>

        <section className="analytics-card">
          <div className="analytics-title-row"><h3>Links Clicked Analysis</h3><a>View All</a></div>
          <div className="links-table">{links.map(([url, clicks])=><div key={String(url)}><span><Link2 size={14}/> {url}</span><b>{clicks}</b></div>)}</div>
        </section>

        <LocationHistory cardId={params.id}/>
      </section>
    </main>
  );
}
