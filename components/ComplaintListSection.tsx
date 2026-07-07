import { ComplaintLocation } from "@/components/ComplaintLocation";
import { ReportCountBadge } from "@/components/ReportCountBadge";
import { SourceTag } from "@/components/SourceTag";
import type { Complaint } from "@/lib/types";

export function ComplaintListSection({
  complaints,
  loading,
  emptyLabel,
}: {
  complaints: Complaint[];
  loading: boolean;
  emptyLabel: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-medium text-neutral-500">
        All complaints ({complaints.length})
      </h2>
      <div className="mt-2 flex flex-col gap-3">
        {loading && <p className="text-sm text-neutral-500">Loading…</p>}
        {!loading && complaints.length === 0 && (
          <p className="text-sm text-neutral-500">{emptyLabel}</p>
        )}
        {complaints.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-1 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-medium uppercase tracking-wide text-neutral-500">
                {c.status}
                <ReportCountBadge reportCount={c.reportCount} />
                <SourceTag complaint={c} />
              </span>
              <span className="text-neutral-500">
                {c.ai.department} · {c.ai.priority}
              </span>
            </div>
            <p className="text-sm">{c.ai.summary}</p>
            <ComplaintLocation location={c.location} />
          </div>
        ))}
      </div>
    </div>
  );
}
