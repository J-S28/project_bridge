import { ComplaintLocation } from "@/components/ComplaintLocation";
import { computeEscalationLevel } from "@/lib/escalation";
import type { Complaint } from "@/lib/types";

function EscalatedComplaintCard({ complaint }: { complaint: Complaint }) {
  const level = computeEscalationLevel(complaint);
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
          {complaint.status}
        </span>
        <span className="text-amber-700 dark:text-amber-400">
          {complaint.ai.escalateToRepresentative
            ? "Needs funding/infra decision"
            : `Stuck${
                level >= 3
                  ? " at MP level"
                  : level >= 2
                    ? " at MLA level"
                    : level >= 1
                      ? " at department head level"
                      : ""
              }`}
        </span>
      </div>
      <p className="text-sm">{complaint.ai.summary}</p>
      <p className="text-xs text-neutral-500">
        {complaint.ai.department} · {complaint.ai.priority}
        {complaint.ai.escalateToRepresentative && complaint.ai.escalationReason
          ? ` · ${complaint.ai.escalationReason}`
          : ""}
      </p>
      <ComplaintLocation location={complaint.location} />
    </div>
  );
}

export function EscalatedSection({
  complaints,
  minLevel = 2,
}: {
  complaints: Complaint[];
  minLevel?: number;
}) {
  const escalated = complaints.filter(
    (c) => c.ai.escalateToRepresentative || computeEscalationLevel(c) >= minLevel
  );

  return (
    <div>
      <h2 className="text-sm font-medium text-neutral-500">
        Escalated ({escalated.length})
      </h2>
      <div className="mt-2 flex flex-col gap-3">
        {escalated.length === 0 && (
          <p className="text-sm text-neutral-500">Nothing escalated right now.</p>
        )}
        {escalated.map((c) => (
          <EscalatedComplaintCard key={c.id} complaint={c} />
        ))}
      </div>
    </div>
  );
}
