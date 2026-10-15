"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { CardRenderer } from "@/components/CardRenderer";
import { emptyCard, templates } from "@/lib/templates";
import { api, endpoints } from "@/lib/api";
import { canAccess } from "@/lib/permissions";

export default function TemplatesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [loggedIn, setLoggedIn] = useState(false);
  const [manage, setManage] = useState(false),
    [create, setCreate] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState("");
  const [catalog, setCatalog] = useState<
    ((typeof templates)[number] & { active: boolean })[]
  >([]);
  async function toggleTemplate(id: string, active: boolean) {
    setBusy(id);
    setError("");
    setCatalog((items) =>
      items.map((t) => (t.id === id ? { ...t, active } : t)),
    );
    try {
      await endpoints.adminSetTemplate(id, active);
    } catch (err) {
      setCatalog((items) =>
        items.map((t) => (t.id === id ? { ...t, active: !active } : t)),
      );
      setError(
        err instanceof Error ? err.message : "Unable to update template",
      );
    } finally {
      setBusy("");
    }
  }
  const categories = [
    "All",
    ...Array.from(new Set(catalog.map((template) => template.category))),
  ];
  const filtered = useMemo(
    () =>
      catalog.filter(
        (template) =>
          (category === "All" || template.category === category) &&
          `${template.name} ${template.description}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [query, category, catalog],
  );

  useEffect(() => {
    (async () => {
      const session = await endpoints.me().catch(() => null);
      setLoggedIn(Boolean(session));
      const admin = Boolean(
        session?.user.role === "admin" && canAccess(session.user, "templates"),
      );
      setManage(admin);
      setCreate(canAccess(session?.user, "cards"));
      const available = admin
        ? await endpoints.adminTemplates()
        : await api<{ id: string; active: boolean }[]>("/templates");
      setCatalog(
        templates
          .filter((t) => available.some((a) => a.id === t.id))
          .map((t) => ({
            ...t,
            active: available.find((a) => a.id === t.id)!.active,
          })),
      );
    })().catch((e) => setError(e.message));
  }, []);

  const content = (
    <section className={loggedIn ? "main" : "page"}>
      <div className="section-title">
        <div>
          <h1>Template gallery</h1>
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="toolbar">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {categories.map((item) => (
            <button
              className={`step ${item === category ? "active" : ""}`}
              key={item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="field" style={{ maxWidth: 320 }}>
          <span>
            <Search size={14} /> Search
          </span>
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="template-grid">
        {filtered.map((template) => {
          const editorUrl = `/editor/new?template=${template.id}`;
          return (
            <article className="template-tile" key={template.id}>
              <div className="template-shot" inert>
                <CardRenderer
                  compact
                  card={{
                    ...emptyCard,
                    templateId: template.id,
                    status: "draft",
                    slug: "",
                  }}
                />
              </div>
              <div className="template-meta">
                <strong>{template.name}</strong>
                <p>{template.category}</p>
                <small>{template.description}</small>
              </div>
              <div className="template-availability">
                {template.active && (!loggedIn || create) ? (
                  <Link
                    className="btn secondary"
                    href={loggedIn ? editorUrl : "/login"}
                  >
                    Use Template
                  </Link>
                ) : (
                  <span>{template.active ? "Available" : "Disabled"}</span>
                )}
                {manage && (
                  <label className="inline-label">
                    <input
                      type="checkbox"
                      role="switch"
                      aria-label={`Enable ${template.name}`}
                      checked={template.active}
                      disabled={Boolean(busy)}
                      onChange={(e) =>
                        toggleTemplate(template.id, e.target.checked)
                      }
                    />
                    {template.active ? "Enabled" : "Disabled"}
                  </label>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {!filtered.length && <p>No templates available.</p>}
    </section>
  );

  if (loggedIn) {
    return (
      <main className="dashboard-layout">
        <AppNav />
        {content}
      </main>
    );
  }

  return (
    <main className="shell">
      <nav className="nav">
        <Link href="/" className="brand">
          <img src="/TTW-Logo.png" alt="" className="brand-logo" />
          TTW card studio
        </Link>
        <div className="nav-links">
          <Link href="/login">Login</Link>
          <Link className="btn" href="/login?next=%2Feditor%2Fnew">
            Create card
          </Link>
        </div>
      </nav>
      {content}
    </main>
  );
}
