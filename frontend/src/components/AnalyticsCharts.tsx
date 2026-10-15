"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import world from "world-atlas/countries-110m.json";
import type { Topology } from "topojson-specification";
const colors = [
  "#4f79ff",
  "#2dbd67",
  "#ef6a83",
  "#f6bd42",
  "#37b7c7",
  "#9372cf",
];
export type Breakdown = { label: string; total: number }[];
export function Bars({
  rows,
  label,
}: {
  rows: { label: string; total: number; unique: number }[];
  label: string;
}) {
  return (
    <div className="analytics-chart" role="img" aria-label={label}>
      {rows.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={{ top: 10, right: 15, bottom: 15, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} width={35} />
            <Tooltip />
            <Legend />
            <Bar
              isAnimationActive={false}
              dataKey="total"
              name="Total scans"
              fill="#4f79ff"
            />
            <Bar
              isAnimationActive={false}
              dataKey="unique"
              name="Unique scans"
              fill="#a2efed"
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="chart-empty">No activity in this date range.</p>
      )}
    </div>
  );
}
export function DonutChart({
  rows,
  label,
}: {
  rows: Breakdown;
  label: string;
}) {
  return (
    <div className="analytics-chart" role="img" aria-label={label}>
      {rows.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              isAnimationActive={false}
              data={rows}
              dataKey="total"
              nameKey="label"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={1}
            >
              {rows.map((r, i) => (
                <Cell key={r.label} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend
              formatter={(value: string) =>
                `${value} (${Math.round(((rows.find((r) => r.label === value)?.total || 0) / rows.reduce((s, r) => s + r.total, 0)) * 100)}%)`
              }
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="chart-empty">No activity in this date range.</p>
      )}
    </div>
  );
}
const land = feature(
  world as unknown as Topology,
  (world as unknown as Topology).objects.countries,
);
const projection = geoNaturalEarth1().fitExtent(
  [
    [10, 10],
    [890, 420],
  ],
  land,
);
const path = geoPath(projection);
export function GeoMap({
  points,
}: {
  points: { latitude: number; longitude: number; label?: string }[];
}) {
  const unique = Array.from(
    new Map(points.map((p) => [`${p.latitude},${p.longitude}`, p])).values(),
  );
  return (
    <svg
      className="analytics-world"
      viewBox="0 0 900 430"
      role="img"
      aria-label={`World map with ${unique.length} recorded locations`}
    >
      <path
        d={path(land) || ""}
        fill="#caeffa"
        stroke="#ffffff"
        strokeWidth=".7"
      />
      {unique.map((p, i) => {
        const xy = projection([p.longitude, p.latitude]);
        return xy ? (
          <circle
            key={i}
            cx={xy[0]}
            cy={xy[1]}
            r={5}
            fill="#007caf"
            stroke="white"
          >
            <title>{p.label || `${p.latitude}, ${p.longitude}`}</title>
          </circle>
        ) : null;
      })}
    </svg>
  );
}
