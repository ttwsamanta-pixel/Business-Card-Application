import {
  Calendar,
  Globe,
  Link,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import {
  siFacebook,
  siInstagram,
  siX,
  siYoutube,
  siTiktok,
  siWhatsapp,
  siBehance,
  siSnapchat,
} from "simple-icons";
const brands = {
  facebook: siFacebook,
  instagram: siInstagram,
  x: siX,
  twitter: siX,
  youtube: siYoutube,
  tiktok: siTiktok,
  whatsapp: siWhatsapp,
  behance: siBehance,
  snapchat: siSnapchat,
};
const icons = {
  phone: Phone,
  mobile: Phone,
  mail: Mail,
  email: Mail,
  globe: Globe,
  website: Globe,
  map: MapPin,
  address: MapPin,
  calendar: Calendar,
  link: Link,
  linkedin: Linkedin,
  skype: MessageCircle,
};
export const masterIconKeys = [
  "globe",
  "phone",
  "mail",
  "map",
  "calendar",
  "link",
  "facebook",
  "instagram",
  "linkedin",
  "x",
  "youtube",
  "tiktok",
  "whatsapp",
  "behance",
  "snapchat",
  "skype",
];
export function MasterIcon({
  name = "globe",
  url = "",
  small = false,
}: {
  name?: string;
  url?: string;
  small?: boolean;
}) {
  const key = name.toLowerCase();
  const brand = brands[key as keyof typeof brands];
  const Icon = icons[key as keyof typeof icons] || Globe;
  return (
    <span
      aria-hidden="true"
      className={`master-icon ${small ? "small" : ""} icon-${key}`}
      style={
        brand && key !== "instagram"
          ? {
              background: `#${brand.hex}`,
              color: key === "snapchat" ? "#111" : "white",
            }
          : undefined
      }
    >
      {url ? (
        <img src={url} alt="" />
      ) : brand ? (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d={brand.path} />
        </svg>
      ) : (
        <Icon size={small ? 16 : 26} />
      )}
    </span>
  );
}
