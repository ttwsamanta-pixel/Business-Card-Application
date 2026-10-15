"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Link2,
  RefreshCw,
  Download,
  X,
  Share2,
} from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { OwnerQr } from "@/components/OwnerQr";
import { PublicCardDialog } from "@/components/PublicCardDialog";
import {
  Bars,
  DonutChart,
  GeoMap,
  type Breakdown,
} from "@/components/AnalyticsCharts";
import { api, publicCardUrl } from "@/lib/api";
import { dateLabel, downloadBlob, type Management } from "@/lib/management";
type Report = {
  total: number;
  unique: number;
  forms: number;
  contacts: number;
  clicks: number;
  timeline: Series;
  hours: Series;
  days: Series;
  devices: Breakdown;
  browsers: Breakdown;
  countries: Breakdown;
  regions: Breakdown;
  cities: Breakdown;
  links: { url: string; total: number }[];
  locations: Point[];
};
type Series = { label: string; total: number; unique: number }[];
type Point = {
  latitude: number;
  longitude: number;
  label?: string;
  accuracy?: number;
  createdAt?: string;
};
type Lead = {
  id: string;
  answers: Record<string, string> | string;
  createdAt?: string;
  created_at?: string;
  cardName?: string;
};
function boundary(day: string, tz: string, end = false) {
  let date = new Date(`${day}T00:00:00Z`);
  if (end) date = new Date(date.getTime() + 86400000);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  const local = Date.UTC(
    +parts.year,
    +parts.month - 1,
    +parts.day,
    +parts.hour,
    +parts.minute,
    +parts.second,
  );
  return new Date(
    date.getTime() - (local - date.getTime()) - (end ? 1 : 0),
  ).toISOString();
}
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>(),
    folderId = id.startsWith("folder-") ? id.slice(7) : "";
  const [management, setManagement] = useState<Management>(),
    [report, setReport] = useState<Report>(),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [refresh, setRefresh] = useState(0);
  const [from, setFrom] = useState(""),
    [to, setTo] = useState(today),
    [tz, setTz] = useState("Asia/Kolkata"),
    [geo, setGeo] = useState("ip"),
    [gps, setGps] = useState<Point[]>([]),
    [leads, setLeads] = useState<Lead[] | null>(null),
    [allLinks, setAllLinks] = useState(false);
  const [campaignStart, setCampaignStart] = useState(""),
    [campaignEnd, setCampaignEnd] = useState(""),
    [notice, setNotice] = useState("");
  const cards =
      management?.cards.filter((c) =>
        folderId ? c.folderId === folderId : c.id === id,
      ) || [],
    card = cards[0];
  const title = folderId
    ? management?.folders.find((f) => f.id === folderId)?.name
    : card?.fullName;
  useEffect(() => {
    setCampaignStart(card?.theme?.campaignStart || "");
    setCampaignEnd(card?.theme?.campaignEnd || "");
  }, [card?.theme?.campaignStart, card?.theme?.campaignEnd]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setReport(undefined);
    setError("");
    const query = new URLSearchParams({
      [folderId ? "folderId" : "cardId"]: folderId || id,
      tz,
    });
    try {
      if (from) query.set("from", boundary(from, tz));
      if (to) query.set("to", boundary(to, tz, true));
    } catch {
      setError("Invalid date range");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const m = await api<Management>("/management");
        const r = await api<Report>(`/management/analytics?${query}`);
        const selected = m.cards.filter((c) =>
          folderId ? c.folderId === folderId : c.id === id,
        );
        const positions: Point[] = [];
        for (const c of selected)
          positions.push(...(await api<Point[]>(`/cards/${c.id}/visits`)));
        if (active) {
          setManagement(m);
          setReport(r);
          setGps(
            positions.filter(
              (p) =>
                p.latitude !== null &&
                p.latitude !== undefined &&
                (!from ||
                  new Date(p.createdAt!).toISOString() >= query.get("from")!) &&
                (!to ||
                  new Date(p.createdAt!).toISOString() <= query.get("to")!),
            ),
          );
        }
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Unable to load analytics");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, folderId, from, to, tz, refresh]);
  const forms = async () => {
    setError("");
    try {
      const rows: Lead[] = [];
      for (const c of cards)
        rows.push(
          ...(await api<Lead[]>(`/cards/${c.id}/leads`)).map((l) => ({
            ...l,
            cardName: c.fullName,
          })),
        );
      setLeads(
        rows.filter((l) => {
          const date = new Date(l.createdAt || l.created_at!).toISOString();
          return (
            (!from || date >= boundary(from, tz)) &&
            (!to || date <= boundary(to, tz, true))
          );
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load form data");
    }
  };
  const answers = (l: Lead): Record<string, string> =>
    typeof l.answers === "string" ? JSON.parse(l.answers) : l.answers;
  const exportLeads = () => {
    const rows = leads || [],
      fields = Array.from(
        new Set(rows.flatMap((l) => Object.keys(answers(l)))),
      );
    const cell = (v: string) =>
      '"' + (/^[=+@\-\t\r]/.test(v) ? "'" : "") + v.replace(/"/g, '""') + '"';
    const csv = [
      ["Card", "Date", ...fields],
      ...rows.map((l) => [
        l.cardName || "",
        l.createdAt || l.created_at || "",
        ...fields.map((f) => answers(l)[f] || ""),
      ]),
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n");
    downloadBlob(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      "form-responses.csv",
    );
  };
  const country = (code: string) => {
    try {
      return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
    } catch {
      return code;
    }
  };
  return (
    <main className="dashboard-layout qr-admin">
      <AppNav />
      <section className="main analytics-main management-main">
        <Link
          className="back-link"
          href={folderId ? "/master/folders" : "/cards"}
        >
          <ArrowLeft size={16} />
          {title || "Analytics"}
        </Link>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="success" role="status">
            {notice}
          </div>
        )}
        <section className="analytics-card hero-card">
          <div>
            <strong>{folderId ? "Folder" : "Digital Business Card"}</strong>
            <h1>{title}</h1>
            {!folderId && card && (
              <>
                <p>
                  <CalendarDays size={14} />
                  {dateLabel(card.createdAt)}
                </p>
                <p>
                  <Link2 size={14} />
                  <a
                    href={publicCardUrl(card.slug)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {publicCardUrl(card.slug)}
                  </a>
                </p>
                <p>Status: {card.status}</p>
              </>
            )}
            {folderId && <p>{cards.length} cards</p>}
          </div>
          {!folderId && <OwnerQr id={card?.id} updatedAt={card?.updatedAt} />}
        </section>
        {!folderId && card && (
          <form
            className="campaign-controls"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setNotice("");
              try {
                await api(`/management/cards/${id}/campaign`, {
                  method: "PUT",
                  body: JSON.stringify({
                    start: campaignStart,
                    end: campaignEnd,
                  }),
                });
                setNotice("Campaign dates saved (Asia/Kolkata).");
                setRefresh((r) => r + 1);
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Unable to save campaign",
                );
              }
            }}
          >
            <label>
              Campaign Start Date
              <input
                type="date"
                value={campaignStart}
                max={campaignEnd}
                onChange={(e) => setCampaignStart(e.target.value)}
              />
            </label>
            <label>
              Campaign End Date
              <input
                type="date"
                value={campaignEnd}
                min={campaignStart}
                onChange={(e) => setCampaignEnd(e.target.value)}
              />
            </label>
            <button className="btn secondary" type="submit">
              Save Dates
            </button>
            <button
              type="button"
              className="btn secondary"
              disabled={card.status !== "published"}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(publicCardUrl(card.slug));
                  setNotice("Card link copied.");
                } catch {
                  setError("Unable to copy card link");
                }
              }}
            >
              <Share2 size={15} />
              Share Card
            </button>
          </form>
        )}
        <div className="analytics-filters">
          <label>
            Timezone
            <select value={tz} onChange={(e) => setTz(e.target.value)}>
              {[
                "Asia/Kolkata",
                "UTC",
                "America/New_York",
                "Europe/London",
                "Asia/Singapore",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            From
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <button onClick={forms}>Form Data</button>
          <button
            title="Refresh analytics"
            aria-label="Refresh analytics"
            onClick={() => setRefresh((r) => r + 1)}
          >
            <RefreshCw size={17} />
          </button>
        </div>
        {loading ? (
          <p role="status">Loading analytics...</p>
        ) : (
          report && (
            <>
              <div className="analytics-stats">
                {[
                  [report.total, "Total Scans"],
                  [report.unique, "Unique Scans"],
                  [report.forms, "Forms Submitted"],
                  [report.clicks, "Links Clicked"],
                  [report.contacts, "Contact Downloads"],
                ].map(([value, label]) => (
                  <div className="analytics-stat" key={label}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <section className="analytics-card">
                <h3>Timeline Analysis</h3>
                <Bars rows={report.timeline} label="Visits by date" />
              </section>
              <div className="analytics-two">
                <section className="analytics-card">
                  <h3>Hour-Wise Analysis</h3>
                  <Bars rows={report.hours} label="Visits by hour" />
                </section>
                <section className="analytics-card">
                  <h3>Day-Wise Analysis</h3>
                  <Bars
                    rows={[...report.days].sort(
                      (a, b) =>
                        [
                          "Mon",
                          "Tue",
                          "Wed",
                          "Thu",
                          "Fri",
                          "Sat",
                          "Sun",
                        ].indexOf(a.label) -
                        [
                          "Mon",
                          "Tue",
                          "Wed",
                          "Thu",
                          "Fri",
                          "Sat",
                          "Sun",
                        ].indexOf(b.label),
                    )}
                    label="Visits by weekday"
                  />
                </section>
              </div>
              <div className="analytics-two">
                <section className="analytics-card">
                  <h3>Device Analysis</h3>
                  <DonutChart
                    rows={report.devices}
                    label="Device distribution"
                  />
                </section>
                <section className="analytics-card">
                  <h3>Browser Analysis</h3>
                  <DonutChart
                    rows={report.browsers}
                    label="Browser distribution"
                  />
                </section>
              </div>
              <section className="analytics-card">
                <div className="analytics-title-row">
                  <h3>Links Clicked Analysis</h3>
                  {report.links.length > 10 && (
                    <button
                      className="link-button"
                      onClick={() => setAllLinks(!allLinks)}
                    >
                      {allLinks ? "Show less" : "View All"}
                    </button>
                  )}
                </div>
                <div className="links-table">
                  {(allLinks ? report.links : report.links.slice(0, 10)).map(
                    (l) => (
                      <div key={l.url}>
                        <span>
                          <Link2 size={14} />
                          {l.url}
                        </span>
                        <b>{l.total}</b>
                      </div>
                    ),
                  )}
                  {!report.links.length && (
                    <p>No link clicks in this date range.</p>
                  )}
                </div>
              </section>
              <section className="analytics-card">
                <div className="analytics-title-row">
                  <h3>Geo Analysis</h3>
                  <div className="segmented">
                    <button
                      aria-pressed={geo === "ip"}
                      onClick={() => setGeo("ip")}
                    >
                      IP Based
                    </button>
                    <button
                      aria-pressed={geo === "gps"}
                      onClick={() => setGeo("gps")}
                    >
                      GPS Based
                    </button>
                  </div>
                </div>
                <p className="geo-note">
                  {geo === "ip"
                    ? "Approximate IP locations. Unknown or private addresses are not plotted."
                    : "Locations shared with visitor consent."}
                </p>
                <GeoMap points={geo === "ip" ? report.locations : gps} />
                {geo === "ip" ? (
                  <div className="geo-columns">
                    {[
                      [report.countries, "Countries"],
                      [report.regions, "States / Regions"],
                      [report.cities, "Cities"],
                    ].map(([entries, label]) => (
                      <div key={String(label)}>
                        <h4>{String(label)} - Top 10</h4>
                        {(entries as Breakdown).slice(0, 10).map((r) => (
                          <div className="geo-rank" key={r.label}>
                            <span>
                              {label === "Countries"
                                ? country(r.label)
                                : r.label}
                            </span>
                            <small>
                              {r.total} (
                              {report.total
                                ? Math.round((r.total / report.total) * 100)
                                : 0}
                              %)
                            </small>
                            <progress value={r.total} max={report.total || 1} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="management-table-scroll">
                    <table className="management-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Latitude</th>
                          <th>Longitude</th>
                          <th>Accuracy</th>
                          <th>Map</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gps.map((p, i) => (
                          <tr key={i}>
                            <td>{dateLabel(p.createdAt)}</td>
                            <td>{p.latitude}</td>
                            <td>{p.longitude}</td>
                            <td>{p.accuracy} m</td>
                            <td>
                              <a
                                target="_blank"
                                rel="noreferrer"
                                href={`https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=12/${p.latitude}/${p.longitude}`}
                              >
                                View
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!gps.length && (
                      <p>No locations shared in this date range.</p>
                    )}
                  </div>
                )}
                <small className="geo-note">
                  IP data: GeoLite by MaxMind. Map: Natural Earth.
                </small>
              </section>
            </>
          )
        )}
        {leads && (
          <PublicCardDialog
            label="Form responses"
            onClose={() => setLeads(null)}
          >
            <button
              className="dialog-close"
              aria-label="Close form responses"
              onClick={() => setLeads(null)}
            >
              <X />
            </button>
            <h2>Form Responses ({leads.length})</h2>
            <button
              className="btn secondary"
              disabled={!leads.length}
              onClick={exportLeads}
            >
              <Download size={16} />
              Export CSV
            </button>
            <div className="lead-results">
              {leads.map((l) => (
                <section key={l.id}>
                  <strong>{l.cardName}</strong>
                  <small>{dateLabel(l.createdAt || l.created_at)}</small>
                  <dl>
                    {Object.entries(answers(l)).map(([key, value]) => (
                      <div key={key}>
                        <dt>{key}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
              {!leads.length && <p>No form responses in this date range.</p>}
            </div>
          </PublicCardDialog>
        )}
      </section>
    </main>
  );
}
