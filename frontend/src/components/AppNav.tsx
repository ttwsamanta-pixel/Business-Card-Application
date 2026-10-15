"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  KeyRound,
  Menu,
  X,
  Sun,
  Moon,
  LayoutDashboard,
  LayoutTemplate,
  ContactRound,
  ChartNoAxesCombined,
  Users,
  Folder,
  Settings2,
  Share2,
  BookUser,
  Link2,
  CalendarDays,
  Images,
  TextCursorInput,
  PanelsTopLeft,
  Maximize2,
  MousePointerClick,
  MessageSquare,
  Blocks,
  Type,
  type LucideIcon,
} from "lucide-react";
import { api, clearToken, endpoints } from "@/lib/api";
import {
  menus,
  canAccess,
  pagePermission,
  type SessionUser,
} from "@/lib/permissions";
import { usePathname } from "next/navigation";

const menuIcons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  templates: LayoutTemplate,
  cards: ContactRound,
  analytics: ChartNoAxesCombined,
  users: Users,
  folders: Folder,
  "master:social": Share2,
  "master:contact": BookUser,
  "master:links": Link2,
  "master:appointment": CalendarDays,
  "master:image-layout": Images,
  "master:field-type": TextCursorInput,
  "master:form-mode": PanelsTopLeft,
  "master:form-size": Maximize2,
  "master:form-trigger": MousePointerClick,
  "master:completion": MessageSquare,
  "master:component": Blocks,
  "master:font": Type,
};
function MenuLabel({ menuKey, label }: { menuKey: string; label: string }) {
  const Icon = menuIcons[menuKey] || Settings2;
  return (
    <span className="sidebar-menu-label">
      <Icon size={18} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

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
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser>();
  const [ready, setReady] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const hello = useMemo(() => greeting(), []);

  useEffect(() => {
    const refresh = () =>
      endpoints
        .me()
        .then((res) => setUser(res.user))
        .catch(() => {
          location.href = "/login";
        })
        .finally(() => setReady(true));
    refresh();
    window.addEventListener("focus", refresh);
    setDark(localStorage.getItem("dbc_theme") === "dark");
    return () => window.removeEventListener("focus", refresh);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.appTheme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => {
    setMobile(false);
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!mobile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobile(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobile]);
  const key = pagePermission(pathname);
  const allowed = !key || canAccess(user, key);
  const visible = menus.filter((m) => canAccess(user, m.key));

  const logout = async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    clearToken();
    location.href = "/login";
  };

  return (
    <>
      {mobile && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        id="app-navigation"
        className={`sidebar ${mobile ? "mobile-open" : ""}`}
      >
        <button
          className="icon-button mobile-nav-close"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        >
          <X size={20} />
        </button>
        <Link href="/" className="brand sidebar-brand">
          <img src="/TTW-Logo.png" alt="" className="brand-logo" />
          <span>TTW card studio</span>
        </Link>
        {visible
          .filter((m) => !m.href.startsWith("/master"))
          .map((m) => (
            <Link
              key={m.key}
              href={m.href}
              aria-current={key === m.key ? "page" : undefined}
            >
              <MenuLabel menuKey={m.key} label={m.label} />
            </Link>
          ))}
        {visible.some((m) => m.href.startsWith("/master")) && (
          <details className="master-nav" open={pathname.startsWith("/master")}>
            <summary>
              <MenuLabel menuKey="master" label="Master" />
              <ChevronDown
                className="master-chevron"
                size={16}
                aria-hidden="true"
              />
            </summary>
            <nav>
              {visible
                .filter((m) => m.href.startsWith("/master"))
                .map((m) => (
                  <Link
                    key={m.key}
                    href={m.href}
                    aria-current={pathname === m.href ? "page" : undefined}
                  >
                    <MenuLabel menuKey={m.key} label={m.label} />
                  </Link>
                ))}
            </nav>
          </details>
        )}
      </aside>

      <header className="topbar">
        <button
          className="icon-button mobile-nav-toggle"
          aria-label="Open navigation"
          aria-expanded={mobile}
          aria-controls="app-navigation"
          onClick={() => setMobile(!mobile)}
        >
          <Menu size={21} />
        </button>
        <div className="greeting">
          <strong>
            {hello}
            {user?.name ? `, ${user.name}` : ""}
          </strong>
          <span>{user?.email || "Welcome back"}</span>
        </div>
        <div className="header-actions">
          <button
            className="icon-button theme-toggle"
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => {
              setDark(!dark);
              localStorage.setItem("dbc_theme", dark ? "light" : "dark");
            }}
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="profile-menu">
            <button
              className="profile-trigger"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
            >
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="" />
              ) : (
                <span>{initials(user?.name)}</span>
              )}
              <strong>{user?.name || "Profile"}</strong>
              <ChevronDown size={16} />
            </button>
            {open ? (
              <div className="profile-dropdown">
                <div className="profile-card-top">
                  {user?.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="" />
                  ) : (
                    <span>{initials(user?.name)}</span>
                  )}
                  <strong>{user?.name || "User"}</strong>
                  <small>{user?.role || "Member"}</small>
                </div>
                <Link
                  className="profile-password-link"
                  href="/change-password"
                  onClick={() => setOpen(false)}
                >
                  <KeyRound size={15} /> Change password
                </Link>
                <div className="profile-card-actions">
                  <Link href="/profile" onClick={() => setOpen(false)}>
                    Update
                  </Link>
                  <button onClick={logout}>Sign out</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      {(!ready || !allowed) && (
        <section className="access-notice" role="status">
          {!ready ? (
            "Loading account..."
          ) : (
            <>
              <h1>Access restricted</h1>
              <p>
                Your account does not have access to this menu. Contact an
                administrator to update your permissions.
              </p>
            </>
          )}
        </section>
      )}
    </>
  );
}
