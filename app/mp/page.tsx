"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { DepartmentBreakdownChart } from "@/components/DepartmentBreakdownChart";
import { EscalatedSection } from "@/components/EscalatedSection";
import { ComplaintListSection } from "@/components/ComplaintListSection";
import { PriorityRankingPanel } from "@/components/PriorityRankingPanel";
import { ReportCountBadge } from "@/components/ReportCountBadge";
import { HotspotMap } from "@/components/HotspotMap";
import { useAIInsight } from "@/lib/useAIInsight";
import { wardsInMPConstituency } from "@/lib/wards";
import { computeEscalationLevel } from "@/lib/escalation";
import type { Complaint } from "@/lib/types";

function WardComparisonTable({ complaints, wards }: { complaints: Complaint[]; wards: string[] }) {
  const rows = wards.map((ward) => {
    const wardComplaints = complaints.filter((c) => c.location.ward === ward);
    const open = wardComplaints.filter(
      (c) => !["Resolved", "Closed"].includes(c.status)
    ).length;
    const escalated = wardComplaints.filter(
      (c) => c.ai.escalateToRepresentative || computeEscalationLevel(c) >= 2
    ).length;
    return { ward, total: wardComplaints.length, open, escalated };
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
          <tr>
            <th className="px-4 py-2 font-medium">Ward</th>
            <th className="px-4 py-2 font-medium">Total</th>
            <th className="px-4 py-2 font-medium">Open</th>
            <th className="px-4 py-2 font-medium">Escalated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.ward} className="border-b border-neutral-100 last:border-0 dark:border-neutral-900">
              <td className="px-4 py-2">{r.ward}</td>
              <td className="px-4 py-2">{r.total}</td>
              <td className="px-4 py-2">{r.open}</td>
              <td className="px-4 py-2">{r.escalated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MpDashboardContent() {
  const { appUser, logout } = useAuth();
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser?.constituency) return;

    const q = query(
      collection(db, "complaints"),
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
  }, [appUser?.constituency]);

  const wards = appUser?.constituency ? wardsInMPConstituency(appUser.constituency) : [];

  const needsFunding = useMemo(
    () => complaints.filter((c) => c.ai.escalateToRepresentative),
    [complaints]
  );

  const cacheKey = appUser?.constituency ? `mp:${appUser.constituency}` : undefined;

  const { insight, attempted } = useAIInsight(
    complaints,
    loading,
    appUser?.constituency ? `${appUser.constituency} constituency` : undefined,
    cacheKey
  );

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-8">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">MP dashboard</h1>
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
            Demand hotspots
          </h2>
          <HotspotMap complaints={complaints} wards={wards} />
        </div>

        <div className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-neutral-500">
            Ward-by-ward comparison
          </h2>
          <WardComparisonTable complaints={complaints} wards={wards} />
        </div>

        <div className="mt-6">
          <PriorityRankingPanel
            complaints={complaints}
            loading={loading}
            wards={wards}
            scopeLabel={appUser?.constituency ?? ""}
            cacheKey={cacheKey ?? ""}
          />
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-medium text-neutral-500">
            Needs funding/infra decision ({needsFunding.length})
          </h2>
          <p className="mt-1 text-xs text-neutral-400">
            Flagged by AI as requiring budget allocation or capital infrastructure,
            not a routine departmental fix.
          </p>
          <div className="mt-2 flex flex-col gap-3">
            {needsFunding.length === 0 && (
              <p className="text-sm text-neutral-500">Nothing in this queue right now.</p>
            )}
            {needsFunding.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-1 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    {c.status}
                    <ReportCountBadge reportCount={c.reportCount} />
                  </span>
                  <span className="text-amber-700 dark:text-amber-400">
                    {c.location.ward}
                  </span>
                </div>
                <p className="text-sm">{c.ai.summary}</p>
                <p className="text-xs text-neutral-500">
                  {c.ai.department} · {c.ai.priority} · {c.ai.escalationReason}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <EscalatedSection complaints={complaints} minLevel={3} />
        </div>

        <div className="mt-6">
          <ComplaintListSection
            complaints={complaints}
            loading={loading}
            emptyLabel="No complaints in this constituency yet."
          />
        </div>
      </div>
    </main>
  );
}

export default function MpPage() {
  return (
    <RoleGuard requiredRole="mp">
      <MpDashboardContent />
    </RoleGuard>
  );
}
