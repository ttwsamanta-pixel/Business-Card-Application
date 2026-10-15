import { masterGroups } from "./masters.js";
import type { Role } from "./types.js";

export const menuKeys = [
  "dashboard",
  "templates",
  "cards",
  "analytics",
  "folders",
  "users",
  ...masterGroups.map((g) => `master:${g.id}`),
];
export function defaultPermissions(role: Role) {
  return role === "admin"
    ? [...menuKeys]
    : ["dashboard", "templates", "cards", "analytics", "folders"];
}
export function effectivePermissions(role: Role, permissions?: string[]) {
  return (permissions ?? defaultPermissions(role)).filter(
    (key) =>
      menuKeys.includes(key) &&
      (role === "admin" || key !== "users"),
  );
}
