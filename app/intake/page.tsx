"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { ComplaintListSection } from "@/components/ComplaintListSection";
import type { Complaint } from "@/lib/types";

const OFFICE_LABEL: Record<string, string> = {
  department: "Department Office",
  mla: "MLA Office",
  mp: "MP Office",
};

function GrievanceIntakeDashboard() {
  const { appUser, logout } = useAuth();
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser?.uid) return;

    const q = query(collection(db, "complaints"), where("citizenId", "==", appUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Complaint);
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setComplaints(items);
      setLoading(false);
    });

    return unsubscribe;
  }, [appUser?.uid]);

  const jurisdiction =
    appUser?.officeType === "mp"
      ? appUser.constituency
      : `${appUser?.constituency}, ${appUser?.state}`;

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-8">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Grievance Intake</h1>
            <p className="text-sm text-neutral-500">
              {appUser?.name} · {appUser?.officeType && OFFICE_LABEL[appUser.officeType]}
              {appUser?.department ? ` · ${appUser.department}` : ""} · {jurisdiction}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/intake/register"
              className="rounded-full bg-foreground px-4 py-2 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              + Register complaint
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

        <p className="mt-4 text-sm text-neutral-400">
          Digitize grievances received by letter, phone, public meetings, or walk-ins —
          they flow through the same AI classification and escalation pipeline as
          citizen-app submissions.
        </p>

        <div className="mt-6">
          <ComplaintListSection
            complaints={complaints}
            loading={loading}
            emptyLabel="No complaints logged yet."
          />
        </div>
      </div>
    </main>
  );
}

export default function IntakePage() {
  return (
    <RoleGuard requiredRole="office_staff">
      <GrievanceIntakeDashboard />
    </RoleGuard>
  );
}
