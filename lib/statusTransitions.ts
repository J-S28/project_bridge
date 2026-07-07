import type { Status } from "./types";

// What an officer is allowed to move a complaint to, from its current status.
// "Rejected" and "Waiting for Information" both require a reason/note — the
// UI enforces that, not this table.
export const OFFICER_NEXT_STATUSES: Record<Status, Status[]> = {
  Submitted: ["Acknowledged", "Rejected"],
  Acknowledged: ["In Progress", "Escalated", "Waiting for Information", "Rejected"],
  "In Progress": ["Escalated", "Pending Citizen Confirmation", "Waiting for Information", "Rejected"],
  "Waiting for Information": ["In Progress", "Rejected"],
  Escalated: ["In Progress", "Pending Citizen Confirmation", "Waiting for Information", "Rejected"],
  Reopened: ["Acknowledged", "In Progress"],
  "Pending Citizen Confirmation": [],
  Resolved: [],
  Rejected: [],
  Closed: [],
};

// What a citizen is allowed to move a complaint to, from its current status.
// Only "Pending Citizen Confirmation" complaints are actionable by the citizen.
export const CITIZEN_NEXT_STATUSES: Record<Status, Status[]> = {
  Submitted: [],
  Acknowledged: [],
  "In Progress": [],
  "Waiting for Information": [],
  Escalated: [],
  "Pending Citizen Confirmation": ["Closed", "Reopened"],
  Reopened: [],
  Resolved: [],
  Rejected: [],
  Closed: [],
};

// A Department Executive can hand a stuck case back to the officer's active
// queue (resetting its clock) rather than resolving it themselves — they
// monitor and reassign, they don't do the department's work for them.
export function canReturnToOfficer(status: Status): boolean {
  return ["In Progress", "Escalated", "Waiting for Information"].includes(status);
}
