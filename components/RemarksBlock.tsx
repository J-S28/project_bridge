"use client";

import { useState } from "react";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { notify } from "@/lib/notifications";
import type { Complaint, Role } from "@/lib/types";

// Department Executives, MLAs, and MPs monitor and annotate — they never
// change status here, they just leave a visible note for whoever looks at
// this case next (an officer, a citizen, or a higher tier).
const REMARK_ROLES: Role[] = ["department_head", "mla", "mp"];

export function RemarksBlock({ complaint }: { complaint: Complaint }) {
  const { appUser } = useAuth();
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canAddRemark = !!appUser && REMARK_ROLES.includes(appUser.role);

  async function submit() {
    if (!appUser || !draft.trim()) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "complaints", complaint.id), {
        remarks: arrayUnion({
          authorId: appUser.uid,
          authorName: appUser.name,
          role: appUser.role,
          text: draft.trim(),
          createdAt: new Date().toISOString(),
        }),
      });
      // Best-effort: a notification failure must never make a successful
      // remark look like it failed.
      notify({
        complaintId: complaint.id,
        message: `${appUser.name} (${appUser.role.replace("_", " ")}) added a remark: ${draft.trim()}`,
        forRole: "officer",
        department: complaint.ai.department,
        ward: complaint.location.ward,
      }).catch(() => {});
      setDraft("");
    } finally {
      setSubmitting(false);
    }
  }

  if (!complaint.remarks?.length && !canAddRemark) return null;

  return (
    <div className="mt-2 flex flex-col gap-1.5 border-t border-neutral-200 pt-2 dark:border-neutral-800">
      {complaint.remarks?.map((r, i) => (
        <div key={i} className="rounded-md bg-neutral-100 p-2 text-xs dark:bg-neutral-900">
          <span className="font-medium">
            {r.authorName} ({r.role.replace("_", " ")}):
          </span>{" "}
          {r.text}
        </div>
      ))}
      {canAddRemark && (
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a remark…"
            className="flex-1 rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-xs dark:border-neutral-700"
          />
          <button
            type="button"
            disabled={submitting || !draft.trim()}
            onClick={submit}
            className="rounded-full border border-neutral-300 px-3 py-1 text-xs disabled:opacity-50 dark:border-neutral-700"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
