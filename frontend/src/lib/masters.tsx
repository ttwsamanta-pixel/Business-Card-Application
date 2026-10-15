"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";
import type { Values } from "./card-content";
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
export type MasterGroup = { id: string; label: string; values: string[] };
export type MasterCatalog = { items: MasterItem[]; groups: MasterGroup[] };
export const masterCategories = [
  ["social", "Social Media"],
  ["contact", "Contact Types"],
  ["links", "Web Links"],
  ["appointment", "Appointments"],
  ["image-layout", "Image Layouts"],
  ["field-type", "Form Field Types"],
  ["form-mode", "Form Display"],
  ["form-size", "Form Sizes"],
  ["form-trigger", "Form Triggers"],
  ["completion", "Completion Messages"],
  ["component", "Content Components"],
  ["font", "Fonts"],
];
const Context = createContext<MasterCatalog & { error: string }>({
  items: [],
  groups: [],
  error: "",
});
export function MasterProvider({ children }: { children: React.ReactNode }) {
  const [catalog, setCatalog] = useState<MasterCatalog>({
    items: [],
    groups: [],
  });
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api<MasterCatalog>("/masters")
      .then((data) => {
        if (active) setCatalog(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <Context.Provider value={{ ...catalog, error }}>
      {children}
    </Context.Provider>
  );
}
export const useMasters = () => useContext(Context);
export function selectedMaster(
  items: MasterItem[],
  category: string,
  values: Values,
) {
  return (
    items.find((i) => i.category === category && i.id === values.masterId) ||
    items.find(
      (i) =>
        i.category === category &&
        (i.label === values.platform ||
          i.label === values.title ||
          i.value === values.type ||
          (values.type === "Phone" && i.value === "Mobile")),
    )
  );
}
export function masterValues(entry: MasterItem, type: string): Values {
  return {
    masterId: entry.id,
    title: entry.label,
    label: entry.label,
    subtitle: entry.subtitle,
    showSubtitle: !!entry.subtitle,
    icon: entry.iconUrl,
    iconKey: entry.iconKey,
    platform: entry.label,
    type:
      type === "contact" && entry.value === "Mobile" ? "Phone" : entry.value,
  };
}
