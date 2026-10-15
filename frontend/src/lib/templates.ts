export type SocialLink = { id?: string; platform: string; url: string };
export type CardProfile = {
  createdAt?: string;
  updatedAt?: string;
  folderId?: string;
  scans?: number;
  content?: import('./card-content').ContentSection[];
  id?: string;
  templateId: string;
  slug?: string;
  status?: "draft" | "published";
  fullName: string;
  designation?: string;
  company?: string;
  bio?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  address?: string;
  mapsUrl?: string;
  profileImageUrl?: string;
  logoUrl?: string;
  theme?: Record<string, string>;
  socialLinks: SocialLink[];
};

export type Template = {
  id: string;
  name: string;
  category: string;
  description: string;
  bg: string;
  accent: string;
  layout: string;
  active: boolean;
};

export const templates: Template[] = [
  {id:"signature-classic",name:"Signature Classic",category:"Classic",description:"Centered portrait, clean white cards and familiar social rows.",bg:"sunset",accent:"#ef4444",layout:"center",active:true},
  {id:"soft-pastel",name:"Soft Pastel",category:"Gradient",description:"Gentle pastel glow with airy spacing and rounded cards.",bg:"pastel",accent:"#e85b70",layout:"center",active:true},
  {id:"pure-minimal",name:"Pure Minimal",category:"Classic",description:"Quiet neutral background with soft elevation.",bg:"white",accent:"#111827",layout:"center",active:true},
  {id:"royal-violet",name:"Royal Violet",category:"Gradient",description:"Bold violet canvas with crisp white panels.",bg:"violet",accent:"#4c2dbb",layout:"center",active:true},
  {id:"wave-editorial",name:"Wave Editorial",category:"Creative",description:"Editorial cover photo with a flowing wave transition.",bg:"violet",accent:"#ff5964",layout:"wave",active:true},
  {id:"midnight-cyan",name:"Midnight Cyan",category:"Dark",description:"Black premium background with cyan highlights.",bg:"black",accent:"#81d1e7",layout:"cover",active:true},
  {id:"corporate-navy",name:"Corporate Navy",category:"Corporate",description:"Deep navy, office imagery and orange accents.",bg:"navy",accent:"#ff862e",layout:"cover",active:true},
  {id:"monochrome-luxe",name:"Monochrome Luxe",category:"Dark",description:"Textured black mood with monochrome portrait.",bg:"texture",accent:"#f3f4f6",layout:"center",active:true},
  {id:"clean-coral",name:"Clean Coral",category:"Classic",description:"Bright coral backdrop with simple centered profile.",bg:"coral",accent:"#071744",layout:"center",active:true},
  {id:"rose-curve",name:"Rose Curve",category:"Creative",description:"Pink canvas and curved cover-photo header.",bg:"rose",accent:"#ed4b58",layout:"wave",active:true},
  {id:"emerald-health",name:"Emerald Health",category:"Corporate",description:"Deep teal and mint accents for professional services.",bg:"teal",accent:"#4bd4a0",layout:"wave",active:true},
  {id:"warm-leather",name:"Warm Leather",category:"Premium",description:"Warm brown accents and a refined cover layout.",bg:"white",accent:"#9a4a12",layout:"cover",active:true},
  {id:"blue-panel",name:"Blue Panel",category:"Gradient",description:"A vibrant blue profile panel against a lilac frame.",bg:"lilac",accent:"#5b8cff",layout:"panel",active:true},
  {id:"frosted-glass",name:"Frosted Glass",category:"Premium",description:"Soft frosted background, grayscale portrait and glassy cards.",bg:"frost",accent:"#111827",layout:"center",active:true},
  {id:"goldline-executive",name:"Goldline Executive",category:"Premium",description:"Navy executive style with gold line details.",bg:"navy",accent:"#ffc21c",layout:"wave",active:true},
  {id:"studio-split",name:"Studio Split",category:"Corporate",description:"Split profile header with company color block.",bg:"gray",accent:"#ff5b12",layout:"split",active:true},
  {id:"blackout-portrait",name:"Blackout Portrait",category:"Dark",description:"Full portrait fades into a deep black profile card.",bg:"black",accent:"#f4f4f5",layout:"cover",active:true},
  {id:"legal-copper",name:"Legal Copper",category:"Premium",description:"Minimal white layout with copper typography.",bg:"white",accent:"#9a4b13",layout:"wave",active:true},
  {id:"orange-spotlight",name:"Orange Spotlight",category:"Gradient",description:"Navy background and vivid orange hero card.",bg:"navy",accent:"#ff5b12",layout:"photoBottom",active:true},
  {id:"coral-mist",name:"Coral Mist",category:"Classic",description:"White space, soft shadows and coral accents.",bg:"white",accent:"#f34d59",layout:"cover",active:true},
  {id:"citrus-night",name:"Citrus Night",category:"Dark",description:"Midnight blue with high-contrast golden details.",bg:"navy",accent:"#ffbe16",layout:"wave",active:true},
  {id:"glass-gradient",name:"Glass Gradient",category:"Gradient",description:"A layered gradient hero with translucent-style panels.",bg:"pastel",accent:"#7056d8",layout:"panel",active:true},
  {id:"ocean-professional",name:"Ocean Professional",category:"Corporate",description:"Ocean teal with a calm mint highlight.",bg:"teal",accent:"#42d6a0",layout:"center",active:true},
  {id:"modern-portfolio",name:"Modern Portfolio",category:"Creative",description:"Portfolio-style header with a wide photo and compact bio.",bg:"gray",accent:"#ff6a24",layout:"split",active:true},
  {id:"signature-wave-pro",name:"Signature Wave Pro",category:"Creative",description:"A polished wave header, prominent logo and bright action buttons.",bg:"rose",accent:"#ef4855",layout:"wave",active:true}
];

export const emptyCard: CardProfile = {
  templateId: "signature-classic",
  fullName: "Asha Rao",
  designation: "Founder and Brand Strategist",
  company: "Northstar Studio",
  bio: "Helping teams turn first impressions into lasting business relationships.",
  email: "hello@example.com",
  phone: "+1 555 123 4567",
  whatsapp: "+1 555 123 4567",
  website: "https://example.com",
  address: "244 5th Avenue, New York, NY",
  mapsUrl: "https://maps.google.com",
  profileImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=85",
  logoUrl: "",
  theme: { accent: "#635bff" },
  socialLinks: [
    { platform: "LinkedIn", url: "https://linkedin.com" },
    { platform: "Instagram", url: "https://instagram.com" }
  ]
};

export function templateFor(id: string) {
  return templates.find((template) => template.id === id) || templates[0];
}
