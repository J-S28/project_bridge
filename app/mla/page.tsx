"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { DepartmentBreakdownChart } from "@/components/DepartmentBreakdownChart";
import { EscalatedSection } from "@/components/EscalatedSection";
import { ComplaintListSection } from "@/components/ComplaintListSection";
import { PriorityRankingPanel } from "@/components/PriorityRankingPanel";
import { PriorityHeatmap } from "@/components/PriorityHeatmap";
import { useAIInsight } from "@/lib/useAIInsight";
import { DEPARTMENTS } from "@/lib/departments";
import type { Complaint } from "@/lib/types";

function MlaDashboardContent() {
  const { appUser, logout } = useAuth();
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser?.constituency) return;

    const q = query(
      collection(db, "complaints"),
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
  }, [appUser?.constituency]);

  const cacheKey = appUser?.constituency ? `mla:${appUser.constituency}` : undefined;

  const { insight, attempted } = useAIInsight(
    complaints,
    loading,
    appUser?.constituency ? `${appUser.constituency} ward` : undefined,
    cacheKey
  );

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-8">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">MLA dashboard</h1>
            <p className="text-sm text-neutral-500">
              {appUser?.name} · {appUser?.constituency}, {appUser?.state}
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

        <div className="mt-6 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="text-sm font-medium text-neutral-500">AI insight</h2>
          <p className="mt-1">
            {insight ??
              (attempted ? "Not enough data yet to generate an insight." : "Generating…")}
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="text-sm font-medium text-neutral-500">
            Department breakdown
          </h2>
          <div className="mt-2">
            <DepartmentBreakdownChart complaints={complaints} />
          </div>
        </div>

        <div className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-neutral-500">
            Priority heatmap (ward-wise)
          </h2>
          <PriorityHeatmap
            complaints={complaints}
            groups={appUser?.constituency ? [appUser.constituency] : []}
            groupLabel="Ward"
            groupOf={(c) => c.location.ward}
          />
        </div>

        <div className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-neutral-500">
            Priority heatmap (department-wise)
          </h2>
          <PriorityHeatmap
            complaints={complaints}
            groups={DEPARTMENTS}
            groupLabel="Departments"
            groupOf={(c) => c.ai.department}
          />
        </div>

        <div className="mt-6">
          <PriorityRankingPanel
            complaints={complaints}
            loading={loading}
            wards={appUser?.constituency ? [appUser.constituency] : []}
            scopeLabel={appUser?.constituency ?? ""}
            cacheKey={cacheKey ?? ""}
          />
        </div>

        <div className="mt-6">
          <EscalatedSection complaints={complaints} minLevel={2} />
        </div>

        <div className="mt-6">
          <ComplaintListSection
            complaints={complaints}
            loading={loading}
            emptyLabel="No complaints in this ward yet."
          />
        </div>
      </div>
    </main>
  );
}

export default function MlaPage() {
  return (
    <RoleGuard requiredRole="mla">
      <MlaDashboardContent />
    </RoleGuard>
  );
}
