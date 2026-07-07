"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { updateComplaintStatus } from "@/lib/updateComplaintStatus";
import { ComplaintLocation } from "@/components/ComplaintLocation";
import { NotificationBell } from "@/components/NotificationBell";
import { notify } from "@/lib/notifications";
import type { Complaint } from "@/lib/types";

function CitizenComplaintCard({ complaint }: { complaint: Complaint }) {
  const { appUser } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const proofPhoto = [...complaint.history]
    .reverse()
    .find((h) => h.proofImageUrls?.length)?.proofImageUrls?.[0];

  async function respond(confirmed: boolean) {
    if (!appUser) return;
    setUpdating(true);
    setError(null);
    try {
      await updateComplaintStatus(
        complaint,
        confirmed ? "Closed" : "Reopened",
        appUser.uid,
        { note: confirmed ? "Citizen confirmed the fix" : "Citizen rejected the fix" }
      );
      // Best-effort: a notification failure must never make a successful
      // response look like it failed.
      notify({
        complaintId: complaint.id,
        message: confirmed
          ? `Citizen confirmed the fix: ${complaint.ai.summary}`
          : `Citizen reopened the case — not resolved: ${complaint.ai.summary}`,
        forRole: "officer",
        department: complaint.ai.department,
        ward: complaint.location.ward,
      }).catch(() => {});
    } catch {
      setError("Couldn't record your response. Try again.");
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
        <span className="text-xs text-neutral-500">{complaint.ai.department}</span>
      </div>

      <p className="text-sm">{complaint.ai.summary}</p>
      <p className="text-xs text-neutral-400">{complaint.rawText}</p>
      <ComplaintLocation location={complaint.location} />

      {complaint.status === "Pending Citizen Confirmation" && (
        <div className="mt-2 flex flex-col gap-2">
          {proofPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={proofPhoto}
              alt="Officer's proof of work"
              className="h-40 w-auto rounded-md border border-neutral-200 object-cover dark:border-neutral-800"
            />
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={updating}
              onClick={() => respond(true)}
              className="rounded-full bg-foreground px-4 py-1.5 text-xs text-background disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={() => respond(false)}
              className="rounded-full border border-neutral-300 px-4 py-1.5 text-xs dark:border-neutral-700"
            >
              Not resolved
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CitizenDashboard() {
  const { appUser, logout } = useAuth();
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser?.uid) return;

    const q = query(
      collection(db, "complaints"),
      where("citizenId", "==", appUser.uid)
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
  }, [appUser?.uid]);

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-8">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Citizen dashboard</h1>
            <p className="text-sm text-neutral-500">
              {appUser?.name} ({appUser?.email})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell
              filter={appUser?.uid ? { forRole: "citizen", citizenId: appUser.uid } : null}
            />
            <Link
              href="/citizen/submit"
              className="rounded-full bg-foreground px-4 py-2 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Submit a complaint
            </Link>
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
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {loading && <p className="text-sm text-neutral-500">Loading…</p>}
          {!loading && complaints.length === 0 && (
            <p className="text-sm text-neutral-500">
              You haven&apos;t submitted any complaints yet.
            </p>
          )}
          {complaints.map((c) => (
            <CitizenComplaintCard key={c.id} complaint={c} />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function CitizenPage() {
  return (
    <RoleGuard requiredRole="citizen">
      <CitizenDashboard />
    </RoleGuard>
  );
}
