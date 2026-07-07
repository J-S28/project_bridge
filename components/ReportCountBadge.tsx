export function ReportCountBadge({ reportCount }: { reportCount?: number }) {
  const count = reportCount ?? 1;
  if (count <= 1) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
      {count} reports
    </span>
  );
}
