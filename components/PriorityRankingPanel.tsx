"use client";

import { usePriorityRanking } from "@/lib/usePriorityRanking";
import type { Complaint } from "@/lib/types";

export function PriorityRankingPanel({
  complaints,
  loading,
  wards,
  scopeLabel,
  cacheKey,
}: {
  complaints: Complaint[];
  loading: boolean;
  wards: string[];
  scopeLabel: string;
  cacheKey: string;
}) {
  const { priorities, attempted, error } = usePriorityRanking(
    complaints,
    loading,
    wards,
    scopeLabel,
    cacheKey
  );

  return (
    <div className="rounded-xl border border-violet-300 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950/30">
      <h2 className="text-sm font-medium text-violet-700 dark:text-violet-400">
        Priority-ranked development suggestions
      </h2>
      <p className="mt-1 text-xs text-violet-600/80 dark:text-violet-400/70">
        Ranked by citizen suggestion demand against seeded demographic/infra-gap
        data (stands in for Census/NFHS/data.gov.in).
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {!attempted && <p className="text-sm text-neutral-500">Generating…</p>}
        {attempted && error && (
          <p className="text-sm text-red-600">
            Couldn&apos;t generate rankings right now. Try refreshing.
          </p>
        )}
        {attempted && !error && (!priorities || priorities.length === 0) && (
          <p className="text-sm text-neutral-500">
            Not enough suggestion data yet to rank development priorities.
          </p>
        )}
        {priorities?.map((p, i) => (
          <div
            key={`${p.ward}-${i}`}
            className="rounded-lg bg-white p-3 text-sm dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {i + 1}. {p.title}
              </span>
              <span className="text-xs text-neutral-500">{p.ward}</span>
            </div>
            <p className="mt-1 text-xs text-neutral-500">{p.justification}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
