import type { CardProfile } from "./templates";

export type Values = Record<string, string | boolean>;
export type ContentItem = { id: string; values: Values };
export type ContentSection = {
  id: string;
  type: string;
  enabled: boolean;
  background: boolean;
  values: Values;
  items: ContentItem[];
};
export const sectionNames: Record<string, string> = {
  profile: "Profile",
  text: "Heading + Text",
  contact: "Contact Us",
  images: "Images",
  social: "Social Links",
  links: "Links",
  appointment: "Appointment/Calendar",
  lead: "Lead Collection (Collect Contacts)",
};
export const uid = () => crypto.randomUUID();
export const item = (values: Values): ContentItem => ({ id: uid(), values });
export function makeSection(type: string, card: CardProfile): ContentSection {
  const values: Values = {
    title: sectionNames[type],
    description: "",
    showTitle: true,
  };
  let items: ContentItem[] = [];
  if (type === "profile") {
    Object.assign(values, { photo: true, logo: true, connect: true });
    items = [
      item({ type: "Mobile", value: card.phone || "" }),
      item({ type: "Email", value: card.email || "" }),
    ];
  }
  if (type === "text")
    Object.assign(values, { title: "About Me", description: card.bio || "" });
  if (type === "contact") {
    Object.assign(values, {
      icon: true,
      iconUrl: "",
      floating: true,
      button: "Add to Contact",
      saveLink: true,
    });
    items = [
      item({ type: "Phone", label: "Call Us", value: card.phone || "" }),
      item({ type: "Email", label: "Email", value: card.email || "" }),
      item({
        type: "Address",
        label: "Address",
        line1: card.address || "",
        line2: "",
        city: "",
        state: "",
        country: "",
        zip: "",
        direction: false,
        button: "Direction",
        url: card.mapsUrl || "",
      }),
    ];
  }
  if (type === "images")
    Object.assign(values, { showTitle: false, layout: "List" });
  if (type === "social")
    items = card.socialLinks.map((link) =>
      item({
        platform: link.platform,
        url: link.url,
        title: link.platform,
        subtitle: "",
        showSubtitle: true,
        icon: "",
      }),
    );
  if (type === "links")
    items = card.website
      ? [
          item({
            url: card.website,
            title: card.website,
            subtitle: "",
            showSubtitle: false,
            icon: "",
          }),
        ]
      : [];
  if (type === "appointment") {
    Object.assign(values, { title: "Schedule Meeting" });
    items = [item({ url: "", title: "Book on Calendly" })];
  }
  if (type === "lead") {
    Object.assign(values, {
      name: "Contact Collection",
      title: "Hi, great to connect with you!",
      description: "Please provide your information below.",
      mode: "Inline",
      dismiss: true,
      size: "Popup",
      trigger: "On Click",
      delay: "1",
      once: true,
      header: false,
      headerUrl: "",
      footer: "",
      consent: "I agree to the Terms and Privacy Policy",
      termsUrl: "",
      privacyUrl: "",
      supportEmail: "",
      button: "Submit",
      completion: "Toast",
      message: "Thank you for your response.",
    });
    items = ["Name", "Email", "Phone"].map((type) =>
      item({
        label: `Your ${type}`,
        type: type === "Name" ? "One-Line" : type,
        required: true,
        error: "This field is required",
      }),
    );
  }
  return {
    id: uid(),
    type,
    enabled: !["images", "appointment", "lead"].includes(type),
    background: true,
    values,
    items,
  };
}
export function initialContent(card: CardProfile) {
  return Object.keys(sectionNames).map((type) => makeSection(type, card));
}
export function safeLink(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol)
      ? url.href
      : "";
  } catch {
    return "";
  }
}
