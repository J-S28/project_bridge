"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { compressImageToDataUrl } from "@/lib/compressImage";
import { OFFICER_NEXT_STATUSES } from "@/lib/statusTransitions";
import { updateComplaintStatus } from "@/lib/updateComplaintStatus";
import { ComplaintLocation } from "@/components/ComplaintLocation";
import type { Complaint, Status } from "@/lib/types";

function OfficerComplaintCard({ complaint }: { complaint: Complaint }) {
  const { appUser } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextStatuses = OFFICER_NEXT_STATUSES[complaint.status];

  async function handleStatusClick(next: Status) {
    if (!appUser) return;

    if (next === "Pending Citizen Confirmation") {
      fileInputRef.current?.click();
      return;
    }

    setUpdating(true);
    setError(null);
    try {
      await updateComplaintStatus(complaint, next, appUser.uid);
    } catch {
      setError("Couldn't update status. Try again.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleProofPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !appUser) return;

    setUpdating(true);
    setError(null);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      await updateComplaintStatus(
        complaint,
        "Pending Citizen Confirmation",
        appUser.uid,
        { proofImageUrls: [dataUrl] }
      );
    } catch {
      setError("Couldn't attach proof photo. Try again.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {complaint.status}
        </span>
        <span className="text-xs text-neutral-500">{complaint.ai.priority}</span>
      </div>

      <p className="text-sm">{complaint.ai.summary}</p>
      <p className="text-xs text-neutral-500">
        {complaint.ai.category} / {complaint.ai.subcategory}
      </p>
      <p className="text-xs text-neutral-400">{complaint.rawText}</p>
      <ComplaintLocation location={complaint.location} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {nextStatuses.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {nextStatuses.map((next) => (
            <button
              key={next}
              type="button"
              disabled={updating}
              onClick={() => handleStatusClick(next)}
              className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs disabled:opacity-50 dark:border-neutral-700"
            >
              {next === "Pending Citizen Confirmation"
                ? "Mark done (attach proof photo)"
                : `Mark ${next}`}
            </button>
          ))}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProofPhoto}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}

function OfficerDashboard() {
  const { appUser, logout } = useAuth();
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser?.department || !appUser?.constituency) return;

    const q = query(
      collection(db, "complaints"),
      where("ai.department", "==", appUser.department),
      where("location.ward", "==", appUser.constituency)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Complaint
      );
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setComplaints(items);
      setLoading(false);
    });

    return unsubscribe;
  }, [appUser?.department, appUser?.constituency]);

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-8">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Officer dashboard</h1>
            <p className="text-sm text-neutral-500">
              {appUser?.name} · {appUser?.department} · {appUser?.constituency}
              , {appUser?.state}
            </p>
          </div>
          <button
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
          >
            Log out
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {loading && <p className="text-sm text-neutral-500">Loading…</p>}
          {!loading && complaints.length === 0 && (
            <p className="text-sm text-neutral-500">
              No complaints in your department yet.
            </p>
          )}
          {complaints.map((c) => (
            <OfficerComplaintCard key={c.id} complaint={c} />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function OfficerPage() {
  return (
    <RoleGuard requiredRole="officer">
      <OfficerDashboard />
    </RoleGuard>
  );
}
