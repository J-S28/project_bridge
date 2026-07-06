"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { EscalatedSection } from "@/components/EscalatedSection";
import { ComplaintListSection } from "@/components/ComplaintListSection";
import type { Complaint } from "@/lib/types";

function DepartmentHeadDashboardContent() {
  const { appUser, logout } = useAuth();
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser?.department || !appUser?.constituency) return;

    const q = query(
      collection(db, "complaints"),
      where("ai.department", "==", appUser.department),
      where("location.constituencyMP", "==", appUser.constituency)
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
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Department Head dashboard</h1>
            <p className="text-sm text-neutral-500">
              {appUser?.name} · {appUser?.department} · {appUser?.constituency},{" "}
              {appUser?.state}
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

        <p className="mt-4 text-sm text-neutral-400">
          Cases that stayed with an officer past their SLA escalate here first —
          before they reach the MLA or MP.
        </p>

        <div className="mt-6">
          <EscalatedSection complaints={complaints} minLevel={1} />
        </div>

        <div className="mt-6">
          <ComplaintListSection
            complaints={complaints}
            loading={loading}
            emptyLabel="No complaints for this department in this constituency yet."
          />
        </div>
      </div>
    </main>
  );
}

export default function DepartmentHeadPage() {
  return (
    <RoleGuard requiredRole="department_head">
      <DepartmentHeadDashboardContent />
    </RoleGuard>
  );
}
