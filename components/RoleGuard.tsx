"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/lib/types";

const HOME_BY_ROLE: Record<Role, string> = {
  citizen: "/citizen",
  officer: "/officer",
  department_head: "/department-head",
  mla: "/mla",
  mp: "/mp",
  office_staff: "/intake",
};

export function RoleGuard({
  requiredRole,
  children,
}: {
  requiredRole: Role;
  children: React.ReactNode;
}) {
  const { user, appUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user || !appUser) {
      router.replace("/login");
      return;
    }

    if (appUser.role !== requiredRole) {
      router.replace(HOME_BY_ROLE[appUser.role]);
    }
  }, [loading, user, appUser, requiredRole, router]);

  if (loading || !user || !appUser || appUser.role !== requiredRole) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
