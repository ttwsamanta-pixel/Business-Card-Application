"use client";

import Link from "next/link";
import { clearToken } from "@/lib/api";

export function AppNav() {
  return (
    <aside className="sidebar">
      <Link href="/" className="brand"><span className="brand-mark">C</span>CardStudio</Link>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/templates">Templates</Link>
      <Link href="/editor/new">Create Card</Link>
      <Link href="/profile">My Profile</Link>
      <Link href="/admin">Admin</Link>
      <button className="btn secondary" onClick={() => { clearToken(); location.href = "/login"; }}>Logout</button>
    </aside>
  );
}
