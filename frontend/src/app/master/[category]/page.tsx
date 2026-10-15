"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Pencil, Plus, Save, X } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { PhotoUpload, Switch } from "@/components/ContentEditor";
import { MasterIcon, masterIconKeys } from "@/components/MasterIcon";
import { api, endpoints } from "@/lib/api";
import { type MasterCatalog, type MasterItem } from "@/lib/masters";

export default function MasterPage() {
  const { category } = useParams<{ category: string }>();
  const [catalog, setCatalog] = useState<MasterCatalog>({
    groups: [],
    items: [],
  });
  const [allowed, setAllowed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<MasterItem | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const group = catalog.groups.find((g) => g.id === category);
  useEffect(() => {
    let active = true;
    setForm(null);
    setQuery("");
    setLoaded(false);
    Promise.all([endpoints.me(), api<MasterCatalog>("/masters")])
      .then(([me, data]) => {
        if (active) {
          setAllowed(me.user.role === "admin");
          setCatalog(data);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [category]);
  const persist = async (entry: MasterItem) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api(`/masters${entry.id ? `/${entry.id}` : ""}`, {
        method: entry.id ? "PUT" : "POST",
        body: JSON.stringify(entry),
      });
      setCatalog(await api<MasterCatalog>("/masters"));
      setForm(null);
      setMessage("Master option saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };
  const rows = catalog.items.filter(
    (item) =>
      item.category === category &&
      [item.label, item.subtitle].some((value) =>
        value.toLowerCase().includes(query.toLowerCase()),
      ),
  );
  return (
    <main className="dashboard-layout">
      <AppNav />
      <section className="main master-page">
        <div className="master-toolbar">
          <h1>{group?.label || "Master"}</h1>
          {allowed && group ? (
            <button
              className="btn"
              disabled={busy}
              onClick={() => {
                setMessage("");
                setForm({
                  id: "",
                  category,
                  value: group.values[0],
                  label: "",
                  subtitle: "",
                  iconKey: "globe",
                  iconUrl: "",
                  active: true,
                  sortOrder: rows.length,
                });
              }}
            >
              <Plus size={16} />
              Add option
            </button>
          ) : null}
        </div>
        {error ? (
          <div role="alert" className="error">
            {error}
          </div>
        ) : null}
        {message ? (
          <p role="status" className="success">
            {message}
          </p>
        ) : null}
        {!loaded ? (
          <p>Loading...</p>
        ) : !allowed ? (
          <p>Administrator access required.</p>
        ) : !group ? (
          <p>Master list not found.</p>
        ) : (
          <>
            <label className="field master-search">
              Search
              <input
                className="input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="master-table-wrap">
              <table className="master-table">
                <thead>
                  <tr>
                    <th>Icon</th>
                    <th>Name</th>
                    <th>Subtitle</th>
                    <th>Status</th>
                    <th>Order</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <MasterIcon name={entry.iconKey} url={entry.iconUrl} />
                      </td>
                      <td>{entry.label}</td>
                      <td>{entry.subtitle || "-"}</td>
                      <td>
                        <button
                          className="master-status"
                          disabled={busy}
                          aria-label={`${entry.active ? "Disable" : "Enable"} ${entry.label}`}
                          onClick={() =>
                            persist({ ...entry, active: !entry.active })
                          }
                        >
                          {entry.active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td>{entry.sortOrder}</td>
                      <td>
                        <button
                          className="icon-command"
                          title={`Edit ${entry.label}`}
                          aria-label={`Edit ${entry.label}`}
                          onClick={() => setForm({ ...entry })}
                        >
                          <Pencil size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!rows.length ? <p>No options found.</p> : null}
            </div>
            {form ? (
              <div className="master-modal-backdrop">
                <section
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="master-dialog-title"
                  className="master-modal"
                >
                  <div className="master-toolbar">
                    <h2 id="master-dialog-title">
                      {form.id ? "Edit" : "Add"} {group.label}
                    </h2>
                    <button
                      className="icon-command"
                      aria-label="Close"
                      disabled={busy || uploading}
                      onClick={() => setForm(null)}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      persist(form);
                    }}
                  >
                    <fieldset disabled={busy || uploading}>
                      <label className="field">
                        Name
                        <input
                          className="input"
                          required
                          maxLength={120}
                          value={form.label}
                          onChange={(e) =>
                            setForm({ ...form, label: e.target.value })
                          }
                        />
                      </label>
                      <label className="field">
                        Default subtitle
                        <input
                          className="input"
                          maxLength={250}
                          value={form.subtitle}
                          onChange={(e) =>
                            setForm({ ...form, subtitle: e.target.value })
                          }
                        />
                      </label>
                      <label className="field">
                        Type
                        <select
                          className="select"
                          value={form.value}
                          aria-label="Type"
                          onChange={(e) =>
                            setForm({ ...form, value: e.target.value })
                          }
                        >
                          {group.values.map((value) => (
                            <option key={value}>{value}</option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        Icon
                        <select
                          className="select"
                          aria-label="Icon"
                          value={
                            masterIconKeys.includes(form.iconKey)
                              ? form.iconKey
                              : "globe"
                          }
                          onChange={(e) =>
                            setForm({ ...form, iconKey: e.target.value })
                          }
                        >
                          {masterIconKeys.map((key) => (
                            <option key={key}>{key}</option>
                          ))}
                        </select>
                      </label>
                      <MasterIcon name={form.iconKey} url={form.iconUrl} />
                      <PhotoUpload
                        label="Master icon"
                        value={form.iconUrl}
                        onChange={(iconUrl) =>
                          setForm((current) =>
                            current ? { ...current, iconUrl } : null,
                          )
                        }
                        onBusy={setUploading}
                      />
                      <label className="field">
                        Display order
                        <input
                          type="number"
                          className="input"
                          min={0}
                          max={9999}
                          value={form.sortOrder}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              sortOrder: Number(e.target.value),
                            })
                          }
                        />
                      </label>
                      <Switch
                        label="Active"
                        value={form.active}
                        onChange={(active) => setForm({ ...form, active })}
                      />
                      <button className="btn" type="submit">
                        <Save size={16} />
                        {busy ? "Saving..." : "Save option"}
                      </button>
                    </fieldset>
                  </form>
                  {error ? (
                    <p role="alert" className="error">
                      {error}
                    </p>
                  ) : null}
                </section>
              </div>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
