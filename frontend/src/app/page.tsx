import Link from "next/link";
import { ArrowRight, BadgeCheck, LayoutTemplate, QrCode, ShieldCheck } from "lucide-react";
import { CardRenderer } from "@/components/CardRenderer";
import { emptyCard, templates } from "@/lib/templates";

export default function LandingPage() {
  return (
    <main className="shell">
      <nav className="nav">
        <Link href="/" className="brand"><span className="brand-mark">C</span>CardStudio</Link>
        <div className="nav-links">
          <Link href="/templates">Templates</Link>
          <Link href="/login">Login</Link>
          <Link href="/register" className="btn">Create card <ArrowRight size={16}/></Link>
        </div>
      </nav>
      <section className="page hero">
        <div>
          <h1>Digital business cards that are ready to share.</h1>
          <p>Create polished QR-enabled public profiles, manage multiple cards, and keep every contact detail current from one dashboard.</p>
          <div className="hero-actions">
            <Link className="btn" href="/register">Start free <ArrowRight size={16}/></Link>
            <Link className="btn secondary" href="/templates">View templates</Link>
          </div>
        </div>
        <div className="hero-preview"><div style={{width:360}}><CardRenderer card={{...emptyCard,status:"published",slug:"asha-rao"}} /></div></div>
      </section>
      <section className="page">
        <div className="section-title"><h2>Featured templates</h2><Link href="/templates">Browse all 25</Link></div>
        <div className="template-grid">{templates.slice(0,6).map((template) => <div className="template-tile" key={template.id}><div className="template-shot"><CardRenderer compact card={{...emptyCard,templateId:template.id,status:"published",slug:"demo"}} /></div><div className="template-meta"><strong>{template.name}</strong><p>{template.category}</p></div></div>)}</div>
      </section>
      <section className="page grid">
        {[["Choose a template",LayoutTemplate],["Add QR sharing",QrCode],["Publish securely",ShieldCheck]].map(([title,Icon]) => {
          const C = Icon as typeof BadgeCheck;
          return <div className="panel" key={String(title)}><C color="#305cff"/><h3>{String(title)}</h3><p>Build, preview, publish, and update cards without reprinting anything.</p></div>;
        })}
      </section>
      <footer className="page" style={{display:"flex",justifyContent:"space-between",gap:16,flexWrap:"wrap",color:"#667085"}}><span>CardStudio SaaS</span><span>Privacy · Terms · Contact</span></footer>
    </main>
  );
}
