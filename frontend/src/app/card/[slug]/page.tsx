import type { Metadata } from "next";
import { CardRenderer } from "@/components/CardRenderer";
import type { CardProfile } from "@/lib/templates";
import { headers } from 'next/headers';
import { LockedCard, type LockedPrompt } from '@/components/LockedCard';

const API_BASE = `${process.env.INTERNAL_API_ORIGIN || "http://127.0.0.1:4000"}/api`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function getCard(slug: string): Promise<CardProfile | LockedPrompt | null> {
  const cookie=(await headers()).get('cookie')||'';
  const res = await fetch(
    `${API_BASE}/public/cards/${encodeURIComponent(slug)}`,
    { cache: "no-store", headers:{cookie} },
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json.ok ? json.data : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const card = await getCard(slug);
  if (!card) return { title: "Card not found" };
  if('locked' in card)return {title:'Passcode Protected Card',robots:{index:false,follow:false}};
  const title = `${card.fullName} - ${card.company || "Digital Business Card"}`;
  return {
    title,
    description: card.bio || "Digital business card",
    alternates: { canonical: `${APP_URL}/card/${slug}` },
    openGraph: {
      title,
      description: card.bio || "",
      url: `${APP_URL}/card/${slug}`,
      type: "profile",
      images: card.profileImageUrl ? [card.profileImageUrl] : [],
    },
  };
}

export default async function PublicCardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = await getCard(slug);
  if(card&&'locked' in card)return <LockedCard prompt={card}/>;
  if (!card)
    return (
      <main className="public-page">
        <div className="panel">
          This card is not published or does not exist.
        </div>
      </main>
    );
  return (
    <main className="public-page">
      <div className="public-wrap">
        <CardRenderer card={card} publicMode />
      </div>
    </main>
  );
}
