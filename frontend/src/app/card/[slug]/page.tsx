import type { Metadata } from "next";
import { CardRenderer } from "@/components/CardRenderer";
import type { CardProfile } from "@/lib/templates";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function getCard(slug: string): Promise<CardProfile | null> {
  const res = await fetch(`${API_BASE}/public/cards/${slug}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  const json = await res.json();
  return json.ok ? json.data : null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const card = await getCard(params.slug);
  if (!card) return { title: "Card not found" };
  const title = `${card.fullName} - ${card.company || "Digital Business Card"}`;
  return {
    title,
    description: card.bio || "Digital business card",
    alternates: { canonical: `${APP_URL}/card/${params.slug}` },
    openGraph: { title, description: card.bio || "", url: `${APP_URL}/card/${params.slug}`, type: "profile", images: card.profileImageUrl ? [card.profileImageUrl] : [] }
  };
}

export default async function PublicCardPage({ params }: { params: { slug: string } }) {
  const card = await getCard(params.slug);
  if (!card) return <main className="public-page"><div className="panel">This card is not published or does not exist.</div></main>;
  return <main className="public-page"><div className="public-wrap"><CardRenderer card={card} publicMode /></div></main>;
}
