"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Copy,
  Download,
  Edit,
  Folder,
  Mail,
  MoveRight,
  Plus,
  Share2,
  Sparkles,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  ScanLine,
  CalendarDays,
  ContactRound,
  FileText,
} from "lucide-react";
import { AppNav } from "./AppNav";
import { OwnerQr } from "./OwnerQr";
import { PublicCardDialog } from "./PublicCardDialog";
import { api, endpoints, publicCardUrl } from "@/lib/api";
import {
  cardAsset,
  dateLabel,
  downloadBlob,
  type Management,
} from "@/lib/management";
import type { CardProfile } from "@/lib/templates";
import { canAccess, type SessionUser } from '@/lib/permissions';
export function CardList({ overview = false }: { overview?: boolean }) {
  const [user,setUser]=useState<SessionUser>();
  useEffect(()=>{endpoints.me().then(r=>setUser(r.user)).catch(()=>{});},[]);
  const [data, setData] = useState<Management>({
    cards: [],
    folders: [],
    total: 0,
    month: 0,
  });
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [folder, setFolder] = useState(""),
    [size, setSize] = useState(10),
    [page, setPage] = useState(1),
    [sort, setSort] = useState("updated");
  const [selected, setSelected] = useState<string[]>([]),
    [move, setMove] = useState<string[]>([]),
    [destination, setDestination] = useState("");
  const [modal, setModal] = useState<{
    kind: "share" | "signature";
    card: CardProfile;
  } | null>(null);
  const load = async () => {
    const result = await api<Management>("/management");
    setData(result);
    setSelected([]);
  };
  useEffect(() => {
    setFolder(new URLSearchParams(location.search).get("folder") || "");
    load()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => setPage(1), [search, status, folder, size, sort]);
  const act = async (
    work: () => Promise<unknown>,
    notice: string,
    reload = true,
  ) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await work();
      if (reload) await load();
      setMessage(notice);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };
  const filtered = data.cards
    .filter(
      (c) =>
        `${c.fullName} ${c.company} ${c.slug} ${c.ownerName||''} ${c.ownerEmail||''}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (!status || c.status === status) &&
        (!folder ||
          (folder === "unfiled" ? !c.folderId : c.folderId === folder)),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.fullName.localeCompare(b.fullName)
        : sort === "scans"
          ? (b.scans || 0) - (a.scans || 0)
          : (b.updatedAt || "").localeCompare(a.updatedAt || ""),
    );
  const current = Math.min(
      page,
      Math.max(1, Math.ceil(filtered.length / size)),
    ),
    rows = filtered.slice((current - 1) * size, current * size);
  const escape = (text = "") =>
    text.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]!,
    );
  const signature = (c: CardProfile) =>
    `<table cellpadding="6"><tr><td><strong>${escape(c.fullName)}</strong><br>${escape(c.designation)}<br>${escape(c.company)}<br>${escape(c.email)}<br>${escape(c.phone)}<br><a href="${escape(publicCardUrl(c.slug))}">View my digital business card</a></td></tr></table>`;
  return (
    <main className={`dashboard-layout qr-admin ${canAccess(user,'cards')?'':'no-cards'} ${canAccess(user,'folders')?'':'no-folders'} ${canAccess(user,'analytics')?'':'no-analytics'}`}>
      <AppNav />
      <section className="main qr-main management-main">
        <div className="qr-page-actions">
          <h1>{overview ? "Overview" : "Cards"}</h1>
          {canAccess(user,'cards')&&<Link className="btn" href="/editor/new">
            <Plus size={17} />
            Create New Card
          </Link>}
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="success" role="status">
            {message}
          </div>
        )}
        {overview && (
          <>
            <div className="overview-cards">
              <div className="overview-card blue">
                <ScanLine className="report-icon" size={20} aria-hidden="true" />
                <span>Total Scans</span>
                <strong>{data.total}</strong>
              </div>
              <div className="overview-card green">
                <CalendarDays className="report-icon" size={20} aria-hidden="true" />
                <span>Current Month Scans</span>
                <strong>{data.month}</strong>
              </div>
              <div className="overview-card pink">
                <ContactRound className="report-icon" size={20} aria-hidden="true" />
                <span>Published Cards</span>
                <strong>
                  {data.cards.filter((c) => c.status === "published").length}
                </strong>
              </div>
              <div className="overview-card yellow">
                <FileText className="report-icon" size={20} aria-hidden="true" />
                <span>Draft Cards</span>
                <strong>
                  {data.cards.filter((c) => c.status === "draft").length}
                </strong>
              </div>
            </div>
            {canAccess(user,'folders')&&<section className="qr-section">
              <div className="qr-page-actions">
                <h2>Folders</h2>
                <Link href="/master/folders">Manage Folders</Link>
              </div>
              <div className="folder-strip">
                {data.folders.map((f) => (
                  <button
                    className="folder-card"
                    key={f.id}
                    onClick={() => setFolder(f.id)}
                  >
                    <Folder size={22} />
                    <span>
                      <strong>{f.name}</strong>
                      <small>
                        {dateLabel(f.createdAt)} <b>{f.count}</b>
                      </small>
                    </span>
                  </button>
                ))}
                {!data.folders.length && <p>No folders yet.</p>}
              </div>
            </section>}
          </>
        )}
        <section className="card-list-section">
          <h2>Digital Business Cards</h2>
          <div className="qr-filters">
            <input
              aria-label="Search cards"
              placeholder="Search by name, company or URL"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <label>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>
            <label>
              Folder
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
              >
                <option value="">All folders</option>
                <option value="unfiled">Unfiled</option>
                {data.folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sort
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="updated">Last updated</option>
                <option value="name">Name</option>
                <option value="scans">Total scans</option>
              </select>
            </label>
            <label>
              Show
              <select
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              >
                {[10, 25, 50].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <button
              className="link-button"
              onClick={() => {
                setSearch("");
                setStatus("");
                setFolder("");
                setSort("updated");
              }}
            >
              Clear All
            </button>
          </div>
          {selected.length > 0 && (
            <div className="bulk-actions">
              <span>{selected.length} selected</span>
              <button
                className="btn secondary"
                disabled={busy}
                onClick={() => {
                  setMove(selected);
                  setDestination("");
                }}
              >
                <MoveRight size={16} />
                Move to folder
              </button>
              <button
                className="btn secondary"
                disabled={busy}
                onClick={() => {
                  if (confirm(`Delete ${selected.length} cards permanently?`))
                    void act(async () => {
                      for (const id of selected) await endpoints.deleteCard(id);
                    }, "Cards deleted.");
                }}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
          <div className="management-table-scroll">
            <table className="management-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Select page"
                      checked={
                        rows.some(c=>c.ownedByMe!==false) &&
                        rows.filter(c=>c.ownedByMe!==false).every((c) => selected.includes(c.id!))
                      }
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? Array.from(
                                new Set([
                                  ...selected,
                                  ...rows.filter(c=>c.ownedByMe!==false).map((c) => c.id!),
                                ]),
                              )
                            : selected.filter(
                                (id) => !rows.some((c) => c.id === id),
                              ),
                        )
                      }
                    />
                  </th>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Created By</th>
                  <th>Total Scans</th>
                  <th>QR Code</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((card) => (
                  <tr key={card.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${card.fullName}`}
                        disabled={card.ownedByMe===false}
                        checked={selected.includes(card.id!)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, card.id!]
                              : selected.filter((id) => id !== card.id),
                          )
                        }
                      />
                    </td>
                    <td>
                      <strong>{dateLabel(card.updatedAt)}</strong>
                      <small>Created: {dateLabel(card.createdAt)}</small>
                      <small>
                        Status:{" "}
                        <b>
                          {card.status !== "published" ? "Draft" : card.theme?.campaignStart && Date.now()<new Date(`${card.theme.campaignStart}T00:00:00+05:30`).getTime() ? "Scheduled" : card.theme?.campaignEnd && Date.now()>new Date(`${card.theme.campaignEnd}T23:59:59.999+05:30`).getTime() ? "Expired" : "Active"}
                        </b>
                      </small>
                    </td>
                    <td>
                      <Link href={`/editor/${card.id}`}>
                        <strong>{card.fullName}</strong> <Edit size={13} />
                      </Link>
                      <small className="card-url">
                        {publicCardUrl(card.slug)}
                      </small>
                      <small>
                        <Folder size={12} />{" "}
                        {data.folders.find((f) => f.id === card.folderId)
                          ?.name || "Unfiled"}
                      </small>
                    </td>
                    <td>
                      {card.ownerName || (card.ownedByMe ? user?.name : "Unknown")}
                      {card.ownerEmail && <small>{card.ownerEmail}</small>}
                    </td>
                    <td>
                      <strong>{card.scans || 0}</strong>
                      <Link href={`/analytics/${card.id}`}>
                        View Scan Analytics
                      </Link>
                    </td>
                    <td>
                      <OwnerQr id={card.id} updatedAt={card.updatedAt} />
                    </td>
                    <td>
                      <div className="qr-row-actions">
                        <button
                          disabled={busy}
                          onClick={() =>
                            act(
                              async () =>
                                downloadBlob(
                                  await cardAsset(card.id!),
                                  `${card.slug}.png`,
                                ),
                              "QR downloaded.",
                              false,
                            )
                          }
                        >
                          <Download size={14} />
                          Download
                        </button>
                        <Link href={`/editor/${card.id}?step=3`}>
                          <Sparkles size={14} />
                          Decorate
                        </Link>
                        <Link href={`/editor/${card.id}`}>
                          <Edit size={14} />
                          Edit
                        </Link>
                        <button
                          disabled={busy||card.ownedByMe===false}
                          onClick={() =>
                            act(
                              () => endpoints.duplicateCard(card.id!),
                              "Card duplicated.",
                            )
                          }
                        >
                          <Copy size={14} />
                          Duplicate
                        </button>
                        <button
                          disabled={busy||!canAccess(user,'folders')||card.ownedByMe===false}
                          onClick={() => {
                            setMove([card.id!]);
                            setDestination(card.folderId || "");
                          }}
                        >
                          <MoveRight size={14} />
                          Move to folder
                        </button>
                        <button
                          disabled={card.status !== "published"}
                          title={
                            card.status !== "published"
                              ? "Publish this card before sharing"
                              : undefined
                          }
                          onClick={() => setModal({ kind: "share", card })}
                        >
                          <Share2 size={14} />
                          Share
                        </button>
                        <button
                          disabled={card.status !== "published"}
                          onClick={() => setModal({ kind: "signature", card })}
                        >
                          <Mail size={14} />
                          Email Signature
                        </button>
                        <button
                          disabled={busy||card.ownedByMe===false}
                          onClick={() => {
                            if (confirm(`Delete ${card.fullName} permanently?`))
                              void act(
                                () => endpoints.deleteCard(card.id!),
                                "Card deleted.",
                              );
                          }}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                        <button
                          disabled={busy}
                          onClick={() =>
                            act(
                              () =>
                                card.status === "published"
                                  ? endpoints.unpublishCard(card.id!)
                                  : endpoints.publishCard(card.id!),
                              card.status === "published"
                                ? "Card unpublished."
                                : "Card published.",
                            )
                          }
                        >
                          {card.status === "published"
                            ? "Unpublish"
                            : "Publish"}
                        </button>
                        {card.status === "published" && (
                          <a
                            href={publicCardUrl(card.slug)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink size={14} />
                            View
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading ? (
            <p>Loading cards...</p>
          ) : !rows.length ? (
            <p>No cards found.</p>
          ) : null}
          <div className="qr-pagination">
            <span>
              Showing {filtered.length ? (current - 1) * size + 1 : 0} to{" "}
              {Math.min(current * size, filtered.length)} of {filtered.length}{" "}
              entries
            </span>
            <div className="pagination-buttons">
              <button
                aria-label="Previous page"
                disabled={current <= 1}
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
        </section>
        {!!move.length && (
          <PublicCardDialog label="Move to folder" onClose={() => setMove([])}>
            <h2>Move to folder</h2>
            {error && <p role="alert" className="error">{error}</p>}
            <label>
              Folder
              <select
                className="input"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                <option value="">Unfiled</option>
                {data.folders.filter(f=>!f.userId||f.userId===user?.id).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="dialog-actions">
              <button className="btn secondary" onClick={() => setMove([])}>
                Cancel
              </button>
              <button
                className="btn"
                disabled={busy}
                onClick={() =>
                  act(async () => {
                    await api("/management/folders", {
                      method: "PUT",
                      body: JSON.stringify({
                        cardIds: move,
                        folderId: destination || null,
                      }),
                    });
                    setMove([]);
                  }, "Folder updated.")
                }
              >
                Move
              </button>
            </div>
          </PublicCardDialog>
        )}
        {modal && (
          <PublicCardDialog
            label={modal.kind === "share" ? "Share card" : "Email signature"}
            onClose={() => setModal(null)}
          >
            <button
              className="dialog-close"
              aria-label="Close"
              onClick={() => setModal(null)}
            >
              <X />
            </button>
            <h2>{modal.kind === "share" ? "Share card" : "Email signature"}</h2>
            {error && <p role="alert" className="error">{error}</p>}
            {message && <p role="status">{message}</p>}
            {modal.kind === "share" ? (
              <>
                <OwnerQr id={modal.card.id} />
                <input
                  className="input"
                  aria-label="Card link"
                  readOnly
                  value={publicCardUrl(modal.card.slug)}
                />
                <div className="dialog-actions">
                  <button
                    className="btn"
                    onClick={() =>
                      act(
                        () =>
                          navigator.clipboard.writeText(
                            publicCardUrl(modal.card.slug),
                          ),
                        "Link copied.",
                        false,
                      )
                    }
                  >
                    <Copy size={16} />
                    Copy link
                  </button>
                  <a
                    className="btn secondary"
                    href={`mailto:?subject=${encodeURIComponent(modal.card.fullName)}&body=${encodeURIComponent(publicCardUrl(modal.card.slug))}`}
                  >
                    <Mail size={16} />
                    Email
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="signature-preview">
                  <strong>{modal.card.fullName}</strong>
                  <p>
                    {modal.card.designation}
                    <br />
                    {modal.card.company}
                    <br />
                    {modal.card.email}
                    <br />
                    {modal.card.phone}
                  </p>
                  <a href={publicCardUrl(modal.card.slug)}>
                    View my digital business card
                  </a>
                </div>
                <div className="dialog-actions">
                  <button
                    className="btn"
                    onClick={() =>
                      act(
                        async () => {
                          const html = signature(modal.card);
                          if (
                            navigator.clipboard.write &&
                            typeof ClipboardItem !== "undefined"
                          )
                            await navigator.clipboard.write([
                              new ClipboardItem({
                                "text/html": new Blob([html], {
                                  type: "text/html",
                                }),
                                "text/plain": new Blob(
                                  [
                                    `${modal.card.fullName}\n${publicCardUrl(modal.card.slug)}`,
                                  ],
                                  { type: "text/plain" },
                                ),
                              }),
                            ]);
                          else await navigator.clipboard.writeText(html);
                        },
                        "Signature copied.",
                        false,
                      )
                    }
                  >
                    <Copy size={16} />
                    Copy signature
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() =>
                      downloadBlob(
                        new Blob([signature(modal.card)], {
                          type: "text/html",
                        }),
                        `${modal.card.slug}-signature.html`,
                      )
                    }
                  >
                    <Download size={16} />
                    Download HTML
                  </button>
                </div>
              </>
            )}
          </PublicCardDialog>
        )}
      </section>
    </main>
  );
}
