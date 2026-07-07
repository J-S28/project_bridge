"use client";

import type { Complaint, Priority } from "@/lib/types";

const SEVERITY_ORDER: Priority[] = ["Critical", "High", "Medium", "Low"];

const SEVERITY_STYLE: Record<Priority, string> = {
  Critical: "bg-red-500 border-red-600 text-white",
  High: "bg-orange-400 border-orange-500 text-white",
  Medium: "bg-yellow-300 border-yellow-400 text-neutral-900",
  Low: "bg-green-400 border-green-500 text-neutral-900",
};

// Groups complaints (by ward, department, etc.) and colors each cell by the
// most severe priority still open in that group — a quick-scan heatmap for
// reps who need to know where to look first, not just what's on file.
export function PriorityHeatmap({
  complaints,
  groups,
  groupLabel,
  groupOf,
}: {
  complaints: Complaint[];
  groups: string[];
  groupLabel: string;
  groupOf: (c: Complaint) => string | undefined;
}) {
  const cells = groups.map((group) => {
    const open = complaints.filter(
      (c) => groupOf(c) === group && !["Resolved", "Closed"].includes(c.status)
    );
    const worst = SEVERITY_ORDER.find((p) => open.some((c) => c.ai.priority === p));
    return { group, count: open.length, worst };
  });

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {cells.map((cell) => (
          <div
            key={cell.group}
            className={`flex flex-col items-center justify-center rounded-xl border p-4 text-center ${
              cell.worst
                ? SEVERITY_STYLE[cell.worst]
                : "border-neutral-200 bg-neutral-50 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900"
            }`}
          >
            <span className="text-xs font-medium uppercase tracking-wide opacity-80">
              {cell.group}
            </span>
            <span className="mt-1 text-2xl font-bold">{cell.count}</span>
            <span className="text-xs opacity-80">{cell.worst ?? "No open issues"}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-red-500" /> Critical
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-orange-400" /> High
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-yellow-300" /> Medium
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-green-400" /> Low
        </span>
      </div>
      <p className="mt-2 text-xs text-neutral-400">
        {groupLabel} colored by the most severe open issue in that group.
      </p>
    </div>
  );
}
