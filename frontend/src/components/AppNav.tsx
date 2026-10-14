"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { clearToken, endpoints } from "@/lib/api";

type User = {
  name: string;
  email: string;
  role: string;
  profileImageUrl?: string;
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function initials(name?: string) {
  return (name || "U").trim().slice(0, 1).toUpperCase();
}

export function AppNav() {
  const [user, setUser] = useState<User>();
  const [open, setOpen] = useState(false);
  const hello = useMemo(() => greeting(), []);

  useEffect(() => {
    endpoints.me()
      .then((res) => setUser(res.user))
      .catch(() => setUser(undefined));
  }, []);

  const logout = () => {
    clearToken();
    location.href = "/login";
  };

  return (
    <>
      <aside className="sidebar">
        <Link href="/" className="brand sidebar-brand">
          <img src="/TTW-Logo.png" alt="" className="brand-logo"/>
          <span>TTW card studio</span>
        </Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/templates">Templates</Link>
        <Link href="/editor/new">Create Card</Link>
        {user?.role === "admin" ? <Link href="/admin">Users</Link> : null}
      </aside>

      <header className="topbar">
        <div>
          <strong>{hello}{user?.name ? `, ${user.name}` : ""}</strong>
          <span>{user?.email || "Welcome back"}</span>
        </div>
        <div className="profile-menu">
          <button className="profile-trigger" onClick={() => setOpen(!open)} aria-expanded={open}>
            {user?.profileImageUrl ? <img src={user.profileImageUrl} alt=""/> : <span>{initials(user?.name)}</span>}
            <ChevronDown size={16}/>
          </button>
          {open ? (
            <div className="profile-dropdown">
              <Link href="/profile" onClick={() => setOpen(false)}>Update profile</Link>
              <Link href="/change-password" onClick={() => setOpen(false)}>Change password</Link>
              <button onClick={logout}>Logout</button>
            </div>
          ) : null}
        </div>
      </header>
    </>
  );
}
