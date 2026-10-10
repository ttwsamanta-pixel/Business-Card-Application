export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "card";
}

export function uniqueSlug(base: string) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${slugify(base)}-${suffix}`;
}
