import type { Complaint, Priority } from "./types";

// 0 = assigned officer, 1 = department head, 2 = MLA, 3 = MP
export type EscalationLevel = 0 | 1 | 2 | 3;

const ESCALATION_THRESHOLD_HOURS: Record<Priority, number> = {
  Critical: 24,
  High: 72,
  Medium: 168, // 7 days
  Low: 336, // 14 days
};

// Computed at read time, wherever a complaint is displayed — no stored
// field, no cron job. A complaint that's sat too long visibly moves up
// the chain purely because time has passed.
export function computeEscalationLevel(complaint: Complaint): EscalationLevel {
  if (
    ["Resolved", "Closed", "Pending Citizen Confirmation"].includes(
      complaint.status
    )
  ) {
    return 0;
  }

  const hoursSinceLastUpdate =
    (Date.now() - new Date(complaint.updatedAt).getTime()) / 36e5;
  const threshold = ESCALATION_THRESHOLD_HOURS[complaint.ai.priority];

  if (hoursSinceLastUpdate < threshold) return 0;
  if (hoursSinceLastUpdate < threshold * 2) return 1;
  if (hoursSinceLastUpdate < threshold * 3) return 2;
  return 3;
}
