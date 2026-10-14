import type { CardProfile } from "./templates";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: { message: string; details?: unknown } };

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("dbc_token") || "";
}

export function setToken(token: string) {
  localStorage.setItem("dbc_token", token);
}

export function clearToken() {
  localStorage.removeItem("dbc_token");
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers
    }
  });
  const json = (await res.json()) as ApiResult<T>;
  if (!json.ok) throw new Error(json.error.message);
  return json.data;
}

export async function uploadImage(file: File): Promise<{ publicUrl: string }> {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/uploads`, {
    method: "POST",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error.message);
  return json.data;
}

export const endpoints = {
  login: (body: { email: string; password: string }) => api<{ token: string; user: any }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body: { name: string; email: string; password: string }) => api<{ token: string; user: any }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  forgot: (email: string) => api<{ message: string; devToken?: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  reset: (token: string, password: string) => api<{ changed: boolean }>("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),
  me: () => api<{ user: any }>("/auth/me"),
  updateMe: (body: { name: string; profileImageUrl?: string }) => api<{ user: any }>("/auth/me", { method: "PATCH", body: JSON.stringify(body) }),
  changePassword: (body: { currentPassword: string; newPassword: string }) => api<{ changed: boolean }>("/auth/change-password", { method: "POST", body: JSON.stringify(body) }),
  cards: () => api<CardProfile[]>("/cards"),
  card: (id: string) => api<CardProfile>(`/cards/${id}`),
  createCard: (card: CardProfile) => api<CardProfile>("/cards", { method: "POST", body: JSON.stringify(card) }),
  updateCard: (id: string, card: Partial<CardProfile>) => api<CardProfile>(`/cards/${id}`, { method: "PUT", body: JSON.stringify(card) }),
  deleteCard: (id: string) => api<{ deleted: boolean }>(`/cards/${id}`, { method: "DELETE" }),
  duplicateCard: (id: string) => api<CardProfile>(`/cards/${id}/duplicate`, { method: "POST" }),
  publishCard: (id: string) => api<CardProfile>(`/cards/${id}/publish`, { method: "POST" }),
  unpublishCard: (id: string) => api<CardProfile>(`/cards/${id}/unpublish`, { method: "POST" }),
  publicCard: (slug: string) => api<CardProfile>(`/public/cards/${slug}`),
  adminOverview: () => api<any>("/admin/overview"),
  adminUsers: () => api<any[]>("/admin/users"),
  adminCreateUser: (body: { name: string; email: string; password: string; role: "user" | "admin"; status: "active" | "disabled" }) => api<any>("/admin/users", { method: "POST", body: JSON.stringify(body) }),
  adminSetUserStatus: (id: string, status: "active" | "disabled") => api<any>(`/admin/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  adminSetUserRole: (id: string, role: "user" | "admin") => api<any>(`/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
  adminDeleteUser: (id: string) => api<{ deleted: boolean }>(`/admin/users/${id}`, { method: "DELETE" }),
  adminTemplates: () => api<any[]>("/admin/templates"),
  adminSetTemplate: (id: string, active: boolean) => api(`/admin/templates/${id}`, { method: "PATCH", body: JSON.stringify({ active }) })
};

export function publicCardUrl(slug?: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/card/${slug || ""}`;
}

export function publicApiAsset(path: string) {
  return `${API_BASE.replace(/\/api$/, "")}${path}`;
}
