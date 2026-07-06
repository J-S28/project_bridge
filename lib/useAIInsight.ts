import { useEffect, useState } from "react";
import { getCached, setCached } from "./dashboardCache";
import type { Complaint } from "./types";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function buildInsightPayload(complaints: Complaint[], scopeLabel: string) {
  const now = Date.now();
  const currentStart = now - THIRTY_DAYS_MS;
  const previousStart = now - 2 * THIRTY_DAYS_MS;

  const currentPeriodCounts: Record<string, number> = {};
  const previousPeriodCounts: Record<string, number> = {};
  const subcategoryCounts: Record<string, number> = {};

  for (const c of complaints) {
    const t = new Date(c.createdAt).getTime();
    if (t >= currentStart) {
      currentPeriodCounts[c.ai.department] = (currentPeriodCounts[c.ai.department] ?? 0) + 1;
      subcategoryCounts[c.ai.subcategory] = (subcategoryCounts[c.ai.subcategory] ?? 0) + 1;
    } else if (t >= previousStart) {
      previousPeriodCounts[c.ai.department] = (previousPeriodCounts[c.ai.department] ?? 0) + 1;
    }
  }

  const topSubcategories = Object.entries(subcategoryCounts)
    .map(([subcategory, count]) => ({ subcategory, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { scopeLabel, currentPeriodCounts, previousPeriodCounts, topSubcategories };
}

export function useAIInsight(
  complaints: Complaint[],
  loading: boolean,
  scopeLabel: string | undefined,
  cacheKey: string | undefined
) {
  const [insight, setInsight] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (loading || complaints.length === 0 || !scopeLabel || !cacheKey) return;

    let cancelled = false;
    const fullCacheKey = `insight:${cacheKey}`;

    getCached<string>(fullCacheKey, complaints.length)
      .then((cached) => {
        if (cancelled) return;
        if (cached !== null) {
          setInsight(cached);
          setAttempted(true);
          return;
        }

        return fetch("/api/insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildInsightPayload(complaints, scopeLabel)),
        })
          .then((res) => res.json())
          .then((data) => {
            if (cancelled) return;
            const result = data.insight ?? null;
            setInsight(result);
            if (result) setCached(fullCacheKey, complaints.length, result);
          });
      })
      .catch(() => {
        if (!cancelled) setInsight(null);
      })
      .finally(() => {
        if (!cancelled) setAttempted(true);
      });

    return () => {
      cancelled = true;
    };
    // Only regenerate when the complaint count changes, not on every
    // millisecond-level re-render from onSnapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaints.length, loading, scopeLabel, cacheKey]);

  // With zero complaints the effect above never runs (nothing to analyze),
  // so treat that as "attempted" too rather than showing "Generating…" forever.
  return { insight, attempted: attempted || (!loading && complaints.length === 0) };
}
