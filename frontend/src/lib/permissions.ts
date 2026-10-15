import { masterCategories } from "./masters";
export const menus = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "templates", label: "Templates", href: "/templates" },
  { key: "cards", label: "Cards", href: "/cards" },
  { key: "analytics", label: "Analytics", href: "/analytics/all" },
  { key: "users", label: "Users", href: "/admin", admin: true },
  { key: "folders", label: "Folders", href: "/master/folders" },
  ...masterCategories.map(([id, label]) => ({
    key: `master:${id}`,
    label,
    href: `/master/${id}`,
    admin: true,
  })),
];
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImageUrl?: string;
  permissions?: string[];
};
export function canAccess(user: SessionUser | undefined, key: string) {
  if (!user) return false;
  const menu = menus.find((m) => m.key === key);
  return (
    (!menu?.admin || user.role === "admin") &&
    (user.permissions?.includes(key) ?? true)
  );
}
export function pagePermission(path: string) {
  if (path.startsWith("/editor")) return "cards";
  if (path.startsWith("/analytics")) return "analytics";
  return menus.find((m) => path === m.href)?.key;
}
