"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DEPARTMENTS } from "@/lib/departments";
import type { Complaint } from "@/lib/types";

export function DepartmentBreakdownChart({
  complaints,
}: {
  complaints: Complaint[];
}) {
  const data = useMemo(
    () =>
      DEPARTMENTS.map((dept) => ({
        department: dept,
        count: complaints.filter((c) => c.ai.department === dept).length,
      })),
    [complaints]
  );

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ bottom: 70 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            dataKey="department"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-35}
            textAnchor="end"
            height={80}
          />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
