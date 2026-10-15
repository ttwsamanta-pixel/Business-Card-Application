"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
type Visit = {
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  createdAt: string;
};
export function LocationHistory({ cardId }: { cardId: string }) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api<Visit[]>(`/cards/${cardId}/visits`)
      .then((v) => {
        if (active) setVisits(v);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [cardId]);
  const located = visits.filter(
    (v) => v.latitude != null && v.longitude != null,
  );
  return (
    <section className="analytics-card">
      <h3>Location Shares</h3>
      {error ? (
        <p role="alert" className="error">
          {error}
        </p>
      ) : loading ? (
        <p>Loading locations...</p>
      ) : (
        <>
          <p>{located.length} shared locations</p>
          <div className="master-table-wrap">
            <table className="master-table">
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
                {located.map((v, i) => (
                  <tr key={`${v.createdAt}-${i}`}>
                    <td>{new Date(v.createdAt).toLocaleString()}</td>
                    <td>{v.latitude!.toFixed(5)}</td>
                    <td>{v.longitude!.toFixed(5)}</td>
                    <td>{Math.round(v.accuracy || 0)} m</td>
                    <td>
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${v.latitude}&mlon=${v.longitude}#map=15/${v.latitude}/${v.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View map
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!located.length ? <p>No locations shared yet.</p> : null}
        </>
      )}
    </section>
  );
}
