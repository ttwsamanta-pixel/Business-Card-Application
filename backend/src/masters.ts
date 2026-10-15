import type { BusinessCard } from "./types.js";
export type MasterItem = {
  id: string;
  category: string;
  value: string;
  label: string;
  subtitle: string;
  iconKey: string;
  iconUrl: string;
  active: boolean;
  sortOrder: number;
};
export function applyMasterDefaults<T extends NonNullable<BusinessCard['content']>[number]>(
  content: T[],
  masters: MasterItem[],
): T[] {
  return content.map((section) => {
    if (
      !["profile", "contact", "social", "links", "appointment"].includes(
        section.type,
      )
    )
      return section;
    const category = ["profile", "contact"].includes(section.type)
      ? "contact"
      : section.type;
    return {
      ...section,
      items: section.items.map((row) => {
        const v = row.values;
        const selected =
          masters.find((m) => m.category === category && m.id === v.masterId) ||
          masters.find(
            (m) =>
              m.active &&
              m.category === category &&
              (m.label === v.platform ||
                m.label === v.title ||
                m.value === v.type ||
                (v.type === "Phone" && m.value === "Mobile")),
          );
        if (!selected?.active) return row;
        return {
          ...row,
          values: {
            ...v,
            masterId: selected.id,
            title: selected.label,
            label: selected.label,
            subtitle: selected.subtitle,
            showSubtitle: !!selected.subtitle,
            icon: selected.iconUrl,
            iconKey: selected.iconKey,
            platform: selected.label,
            type:
              section.type === "contact" && selected.value === "Mobile"
                ? "Phone"
                : selected.value,
          },
        };
      }),
    };
  });
}
export const masterGroups = [
  { id: "social", label: "Social Media", values: ["URL"] },
  {
    id: "contact",
    label: "Contact Types",
    values: ["Mobile", "Email", "WhatsApp", "Website", "Address"],
  },
  { id: "links", label: "Web Links", values: ["URL"] },
  { id: "appointment", label: "Appointments", values: ["URL"] },
  {
    id: "image-layout",
    label: "Image Layouts",
    values: ["List", "Grid 1", "Grid 2"],
  },
  {
    id: "field-type",
    label: "Form Field Types",
    values: ["One-Line", "Multi-Line", "Email", "Phone"],
  },
  { id: "form-mode", label: "Form Display", values: ["Inline", "Overlay"] },
  { id: "form-size", label: "Form Sizes", values: ["Popup", "Full Screen"] },
  {
    id: "form-trigger",
    label: "Form Triggers",
    values: ["On Click", "After Delay", "On Scroll"],
  },
  {
    id: "completion",
    label: "Completion Messages",
    values: ["Toast", "Popup"],
  },
  {
    id: "component",
    label: "Content Components",
    values: [
      "text",
      "contact",
      "images",
      "social",
      "links",
      "appointment",
      "lead",
    ],
  },
  {
    id: "font",
    label: "Fonts",
    values: ["Arial", "Georgia", "Verdana", "Tahoma", "Courier New", "Work Sans", "Open Sans", "Roboto", "Playfair Display", "Josefin Sans", "Slabo 27px", "Concert One", "Krona One", "Syne", "Federo", "Viaoda Libre", "Handlee", "Poppins", "Montserrat", "Lato", "Spectral", "Manrope", "Mukta", "Marcellus", "Mulish", "DM Serif Text", "DM Sans", "Be Vietnam Pro", "DM Serif Display"],
  },
];
const social = [
  "Facebook",
  "Instagram",
  "LinkedIn",
  "Twitter",
  "YouTube",
  "TikTok",
  "Skype",
  "Behance",
  "Snapchat",
];
const componentLabels: Record<string, string> = {
  text: "Heading + Text",
  contact: "Contact Us",
  images: "Images",
  social: "Social Links",
  links: "Links",
  appointment: "Appointment/Calendar",
  lead: "Lead Collection",
};
const iconFor = (label: string) =>
  ({
    Mobile: "phone",
    Email: "mail",
    WhatsApp: "whatsapp",
    Website: "globe",
    Address: "map",
    Twitter: "x",
    LinkedIn: "linkedin",
    YouTube: "youtube",
    TikTok: "tiktok",
  })[label] || label.toLowerCase();
export const defaultMasters: MasterItem[] = masterGroups.flatMap((group) => {
  const labels =
    group.id === "social"
      ? social
      : group.id === "links"
        ? ["Website"]
        : group.id === "appointment"
          ? ["Book on Calendly", "Add to Calendar"]
          : group.values;
  return labels.map((label, index) => ({
    id: `${group.id}-${index + 1}`,
    category: group.id,
    value: ["social", "links", "appointment"].includes(group.id)
      ? "URL"
      : label,
    label: componentLabels[label] || label,
    subtitle:
      group.id === "social"
        ? label === "LinkedIn"
          ? "Connect with us on LinkedIn"
          : label === "YouTube"
            ? "Subscribe to our YouTube channel"
            : `Follow us on ${label}`
        : "",
    iconKey:
      group.id === "appointment"
        ? "calendar"
        : group.id === "links"
          ? "globe"
          : iconFor(label),
    iconUrl: "",
    active: true,
    sortOrder: index,
  }));
});
