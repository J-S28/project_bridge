import type { Complaint } from "@/lib/types";

export function SourceTag({ complaint }: { complaint: Complaint }) {
  const source = complaint.source ?? "Citizen App";
  if (source === "Citizen App") return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
      {source}
      {complaint.loggedByName ? ` · logged by ${complaint.loggedByName}` : ""}
    </span>
  );
}
