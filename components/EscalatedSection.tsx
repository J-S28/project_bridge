import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { ComplaintLocation } from "@/components/ComplaintLocation";
import { ReportCountBadge } from "@/components/ReportCountBadge";
import { RemarksBlock } from "@/components/RemarksBlock";
import { computeEscalationLevel } from "@/lib/escalation";
import { canReturnToOfficer } from "@/lib/statusTransitions";
import { notify } from "@/lib/notifications";
import type { Complaint } from "@/lib/types";

function ReturnToOfficerButton({ complaint }: { complaint: Complaint }) {
  const { appUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  if (appUser?.role !== "department_head" || !canReturnToOfficer(complaint.status)) {
    return null;
  }

  async function handleClick() {
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, "complaints", complaint.id), {
        status: "Acknowledged",
        updatedAt: now,
        history: [
          ...complaint.history,
          {
            status: "Acknowledged",
            updatedBy: appUser!.uid,
            updatedAt: now,
            note: "Returned to officer by Department Executive",
          },
        ],
      });
      // Best-effort: a notification failure must never make a successful
      // return-to-officer action look like it failed.
      notify({
        complaintId: complaint.id,
        message: `Case returned to your queue by Department Executive: ${complaint.ai.summary}`,
        forRole: "officer",
        department: complaint.ai.department,
        ward: complaint.location.ward,
      }).catch(() => {});
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      disabled={submitting}
      onClick={handleClick}
      className="mt-1 self-start rounded-full border border-amber-400 px-3 py-1 text-xs text-amber-700 disabled:opacity-50 dark:border-amber-700 dark:text-amber-400"
    >
      Return to officer
    </button>
  );
}

function EscalatedComplaintCard({ complaint }: { complaint: Complaint }) {
  const level = computeEscalationLevel(complaint);
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
          {complaint.status}
          <ReportCountBadge reportCount={complaint.reportCount} />
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
      <ReturnToOfficerButton complaint={complaint} />
      <RemarksBlock complaint={complaint} />
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
