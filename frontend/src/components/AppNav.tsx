"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, KeyRound } from "lucide-react";
import { clearToken, endpoints } from "@/lib/api";
import { masterCategories } from '@/lib/masters';
import { usePathname } from 'next/navigation';

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
  const pathname=usePathname();
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
        <Link href="/cards" aria-current={pathname==='/cards'?'page':undefined}>Cards</Link>
        {user?.role === "admin" ? <Link href="/admin">Users</Link> : null}
        <details className="master-nav" open={pathname.startsWith('/master')}><summary>Master</summary><nav><Link href="/master/folders" aria-current={pathname==='/master/folders'?'page':undefined}>Folders</Link>{user?.role==='admin'&&masterCategories.map(([id,label])=><Link key={id} href={`/master/${id}`} aria-current={pathname===`/master/${id}`?'page':undefined}>{label}</Link>)}</nav></details>
      </aside>

      <header className="topbar">
        <div>
          <strong>{hello}{user?.name ? `, ${user.name}` : ""}</strong>
          <span>{user?.email || "Welcome back"}</span>
        </div>
        <div className="profile-menu">
          <button className="profile-trigger" onClick={() => setOpen(!open)} aria-expanded={open}>
            {user?.profileImageUrl ? <img src={user.profileImageUrl} alt=""/> : <span>{initials(user?.name)}</span>}
            <strong>{user?.name || "Profile"}</strong>
            <ChevronDown size={16}/>
          </button>
          {open ? (
            <div className="profile-dropdown">
              <div className="profile-card-top">
                {user?.profileImageUrl ? <img src={user.profileImageUrl} alt=""/> : <span>{initials(user?.name)}</span>}
                <strong>{user?.name || "User"}</strong>
                <small>{user?.role || "Member"}</small>
              </div>
              <Link className="profile-password-link" href="/change-password" onClick={() => setOpen(false)}><KeyRound size={15}/> Change password</Link>
              <div className="profile-card-actions">
                <Link href="/profile" onClick={() => setOpen(false)}>Update</Link>
                <button onClick={logout}>Sign out</button>
              </div>
            </div>
          ) : null}
        </div>
      </header>
    </>
  );
}
