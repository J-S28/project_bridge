import type { Status } from "./types";

// What an officer is allowed to move a complaint to, from its current status.
export const OFFICER_NEXT_STATUSES: Record<Status, Status[]> = {
  Submitted: ["Acknowledged"],
  Acknowledged: ["In Progress", "Escalated"],
  "In Progress": ["Escalated", "Pending Citizen Confirmation"],
  Escalated: ["In Progress", "Pending Citizen Confirmation"],
  Reopened: ["Acknowledged", "In Progress"],
  "Pending Citizen Confirmation": [],
  Resolved: [],
  Closed: [],
};

// What a citizen is allowed to move a complaint to, from its current status.
// Only "Pending Citizen Confirmation" complaints are actionable by the citizen.
export const CITIZEN_NEXT_STATUSES: Record<Status, Status[]> = {
  Submitted: [],
  Acknowledged: [],
  "In Progress": [],
  Escalated: [],
  "Pending Citizen Confirmation": ["Closed", "Reopened"],
  Reopened: [],
  Resolved: [],
  Closed: [],
};
