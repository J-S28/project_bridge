import { useEffect, useState } from "react";
import { getCached, setCached } from "./dashboardCache";
import { WARD_DEMOGRAPHICS } from "./demographics";
import type { Complaint } from "./types";

export interface Priority {
  title: string;
  ward: string;
  justification: string;
}

function buildWardsPayload(complaints: Complaint[], wards: string[]) {
  return wards
    .filter((ward) => WARD_DEMOGRAPHICS[ward])
    .map((ward) => {
      const suggestions = complaints.filter(
        (c) => c.type === "Suggestion" && c.location.ward === ward
      );
      const counts: Record<string, number> = {};
      for (const s of suggestions) {
        counts[s.ai.category] = (counts[s.ai.category] ?? 0) + 1;
      }
      return {
        ward,
        suggestionCounts: Object.entries(counts).map(([category, count]) => ({
          category,
          count,
        })),
        demographics: WARD_DEMOGRAPHICS[ward],
      };
    });
}

export function usePriorityRanking(
  complaints: Complaint[],
  loading: boolean,
  wards: string[],
  scopeLabel: string | undefined,
  cacheKey: string | undefined
) {
  const [priorities, setPriorities] = useState<Priority[] | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (loading || wards.length === 0 || !scopeLabel || !cacheKey) return;

    let cancelled = false;
    const fullCacheKey = `priority:${cacheKey}`;

    getCached<Priority[]>(fullCacheKey, complaints.length)
      .then((cached) => {
        if (cancelled) return;
        if (cached !== null) {
          setPriorities(cached);
          setAttempted(true);
          return;
        }

        return fetch("/api/priority-ranking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scopeLabel,
            wards: buildWardsPayload(complaints, wards),
          }),
        })
          .then((res) => {
            if (!res.ok) throw new Error("Priority ranking request failed");
            return res.json();
          })
          .then((data) => {
            if (cancelled) return;
            const result = data.priorities ?? [];
            setPriorities(result);
            setCached(fullCacheKey, complaints.length, result);
          });
      })
      .catch(() => {
        if (!cancelled) setError(true);
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
  }, [complaints.length, loading, wards.join(","), scopeLabel, cacheKey]);

  return {
    priorities,
    error,
    attempted: attempted || (!loading && wards.length === 0),
  };
}
