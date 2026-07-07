"use client";

import { WARD_COORDS } from "@/lib/wards";
import { computeEscalationLevel } from "@/lib/escalation";
import type { Complaint } from "@/lib/types";

// A lightweight, self-contained "map" of demand hotspots — no Google Maps
// tiles, no billing. Wards are plotted by their real lat/lng, projected
// into an SVG canvas; bubble size encodes complaint volume so reps can see
// where demand is concentrated at a glance.
export function HotspotMap({
  complaints,
  wards,
}: {
  complaints: Complaint[];
  wards: string[];
}) {
  const points = wards
    .filter((ward) => WARD_COORDS[ward])
    .map((ward) => {
      const wardComplaints = complaints.filter((c) => c.location.ward === ward);
      const open = wardComplaints.filter(
        (c) => !["Resolved", "Closed"].includes(c.status)
      ).length;
      const escalated = wardComplaints.filter(
        (c) => c.ai.escalateToRepresentative || computeEscalationLevel(c) >= 1
      ).length;
      return { ward, ...WARD_COORDS[ward], total: wardComplaints.length, open, escalated };
    });

  if (points.length === 0) {
    return <p className="text-sm text-neutral-500">No location data yet.</p>;
  }

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const latRange = Math.max(Math.max(...lats) - Math.min(...lats), 0.01);
  const lngRange = Math.max(Math.max(...lngs) - Math.min(...lngs), 0.01);
  const minLat = Math.min(...lats);
  const minLng = Math.min(...lngs);

  const W = 640;
  const H = 300;
  const PAD = 70;

  function project(lat: number, lng: number) {
    const x = PAD + ((lng - minLng) / lngRange) * (W - 2 * PAD);
    const y = H - PAD - ((lat - minLat) / latRange) * (H - 2 * PAD);
    return { x, y };
  }

  const maxTotal = Math.max(...points.map((p) => p.total), 1);

  return (
    <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full" style={{ maxWidth: 640 }}>
          {points.map((p) => {
            const { x, y } = project(p.lat, p.lng);
            const radius = 16 + Math.sqrt(p.total / maxTotal) * 34;
            const color = p.escalated > 0 ? "#d97706" : "#2563eb";
            return (
              <g key={p.ward}>
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={color}
                  fillOpacity={0.18}
                  stroke={color}
                  strokeWidth={1.5}
                />
                <circle cx={x} cy={y} r={4} fill={color} />
                <text
                  x={x}
                  y={y - radius - 8}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={500}
                  fill="#71717a"
                >
                  {p.ward}
                </text>
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={700}
                  fill={color}
                >
                  {p.total}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-2 text-xs text-neutral-400">
        Bubble size = total complaints reported in that ward. Amber = ward has at least
        one escalated case.
      </p>
    </div>
  );
}
