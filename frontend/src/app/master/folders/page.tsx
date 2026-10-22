"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Folder,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { PublicCardDialog } from "@/components/PublicCardDialog";
import { api } from "@/lib/api";
import {
  dateLabel,
  type Management,
  type Folder as FolderType,
} from "@/lib/management";
export default function FoldersPage() {
  const [folders, setFolders] = useState<FolderType[]>([]),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [size, setSize] = useState(10),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<{ id?: string; name: string } | null>(null);
  const load = async () =>
    setFolders((await api<Management>("/management?scope=own")).folders);
  useEffect(() => {
    load()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
      setEdit(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };
  const filtered = folders.filter((f) =>
      f.name.toLowerCase().includes(search.toLowerCase()),
    ),
    current = Math.min(page, Math.max(1, Math.ceil(filtered.length / size)));
  return (
    <main className="dashboard-layout qr-admin">
      <AppNav />
      <section className="main qr-main management-main">
        <div className="qr-page-actions">
          <h1>Folders</h1>
          <div className="qr-action-row">
            <button
              className="btn secondary"
              onClick={() => setEdit({ name: "" })}
            >
              <Plus size={18} />
              Create New Folder
            </button>
            <Link className="btn" href="/editor/new">
              <Plus size={18} />
              Create New Card
            </Link>
          </div>
        </div>
        {error && (
          <div role="alert" className="error">
            {error}
          </div>
        )}
        <div className="qr-filters">
          <input
            aria-label="Search folders"
            placeholder="Search by folder name"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <label>
            Show
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 25, 50].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="management-table-scroll">
          <table className="management-table folder-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Folder Name</th>
                <th>Cards</th>
                <th>Analytics</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice((current - 1) * size, current * size).map((f) => (
                <tr key={f.id}>
                  <td>
                    {dateLabel(f.updatedAt)}
                    <small>Created: {dateLabel(f.createdAt)}</small>
                  </td>
                  <td>
                    <Folder size={18} /> <strong>{f.name}</strong>
                  </td>
                  <td>{f.count}</td>
                  <td>
                    <Link href={`/analytics/folder-${f.id}`}>
                      <ChartColumn size={15} />
                      View Scan Analytics
                    </Link>
                  </td>
                  <td>
                    <div className="folder-actions">
                      <Link href={`/cards?folder=${f.id}`}>
                        <Eye size={16} />
                        View Folder
                      </Link>
                      <button
                        title="Rename folder"
                        aria-label={`Rename ${f.name}`}
                        onClick={() => setEdit({ id: f.id, name: f.name })}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        title="Delete folder"
                        aria-label={`Delete ${f.name}`}
                        disabled={busy}
                        onClick={() => {
                          if (
                            confirm(
                              "Delete this folder? Cards will remain in Unfiled.",
                            )
                          )
                            void act(() =>
                              api(`/management/folders/${f.id}`, {
                                method: "DELETE",
                              }),
                            );
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading ? (
          <p>Loading folders...</p>
        ) : !filtered.length ? (
          <p>No folders found.</p>
        ) : null}
        <div className="qr-pagination">
          <span>{filtered.length} folders</span>
          <div className="pagination-buttons">
            <button
              aria-label="Previous page"
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <span>{current}</span>
            <button
              aria-label="Next page"
              disabled={current * size >= filtered.length}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        {edit && (
          <PublicCardDialog
            label={edit.id ? "Rename folder" : "Create folder"}
            onClose={() => setEdit(null)}
          >
            <h2>{edit.id ? "Rename folder" : "Create New Folder"}</h2>
            {error && <p role="alert" className="error">{error}</p>}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void act(() =>
                  api(`/management/folders${edit.id ? "/" + edit.id : ""}`, {
                    method: edit.id ? "PUT" : "POST",
                    body: JSON.stringify({ name: edit.name }),
                  }),
                );
              }}
            >
              <label>
                Folder name
                <input
                  className="input"
                  required
                  maxLength={100}
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </label>
              <div className="dialog-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setEdit(null)}
                >
                  Cancel
                </button>
                <button className="btn" disabled={busy}>
                  {busy ? "Saving..." : "Save Folder"}
                </button>
              </div>
            </form>
          </PublicCardDialog>
        )}
      </section>
    </main>
  );
}
