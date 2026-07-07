export type Role =
  | "citizen"
  | "officer"
  | "department_head"
  | "mla"
  | "mp"
  | "office_staff";

export type OfficeType = "mp" | "mla" | "department";

export type ComplaintSource =
  | "Citizen App"
  | "Public Meeting"
  | "Walk-in"
  | "Letter"
  | "Phone Call"
  | "Email"
  | "WhatsApp"
  | "Existing Government Portal";

export type Department =
  | "Roads & Infrastructure"
  | "Water Supply"
  | "Sanitation"
  | "Electricity"
  | "Police & Public Safety"
  | "Parks & Environment"
  | "Health & Public Services"
  | "General Administration";

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: Role;
  department?: Department; // officer/department_head/office_staff (if officeType "department")
  state?: string; // officer/department_head/mla/mp/office_staff
  constituency?: string; // officer/mla: ward name; department_head/mp: constituency name
  officeType?: OfficeType; // office_staff only — which office they're attached to
  createdAt: string;
}

export type Status =
  | "Submitted"
  | "Acknowledged"
  | "In Progress"
  | "Waiting for Information"
  | "Escalated"
  | "Pending Citizen Confirmation"
  | "Reopened"
  | "Resolved"
  | "Rejected"
  | "Closed";

export type Priority = "Critical" | "High" | "Medium" | "Low";

export type Sentiment =
  | "Urgent"
  | "Frustrated"
  | "Neutral"
  | "Appreciative"
  | "Suggestion";

export interface AIClassification {
  department: Department;
  category: string;
  subcategory: string;
  priority: Priority;
  sentiment: Sentiment;
  summary: string; // <=25 words
  confidence: number; // 0-1
  escalateToRepresentative: boolean;
  escalationReason?: string;
}

export interface ComplaintHistoryEntry {
  status: Status;
  note?: string;
  updatedBy: string;
  updatedAt: string;
  proofImageUrls?: string[];
}

// Added by a Department Executive, MLA, or MP as they monitor a case — never
// a status change, just a visible annotation for whoever looks at it next.
export interface Remark {
  authorId: string;
  authorName: string;
  role: Role;
  text: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  citizenId: string;
  type: "Grievance" | "Suggestion";
  rawText: string;
  imageUrls: string[];
  location: {
    lat: number;
    lng: number;
    address?: string;
    state?: string;
    district?: string;
    ward?: string;
    constituencyMLA?: string;
    constituencyMP?: string;
  };
  ai: AIClassification;
  status: Status;
  history: ComplaintHistoryEntry[];
  remarks?: Remark[];
  assignedOfficerId?: string;
  createdAt: string;
  updatedAt: string;
  citizenRating?: number;
  citizenFeedback?: string;
  // Duplicate consolidation: every complaint's clusterId points at the
  // canonical complaint's own id (itself, for the canonical one). A
  // confident duplicate never gets its own document — instead the
  // canonical complaint's reportCount/reportedByCitizenIds are updated.
  clusterId: string;
  reportCount: number;
  reportedByCitizenIds: string[];
  // Multi-channel intake: how this complaint reached the platform, and (for
  // office-staff-logged ones) who logged it and any citizen contact details
  // they took down.
  source: ComplaintSource;
  loggedByRole?: Role;
  loggedByName?: string;
  reportedCitizenName?: string;
  reportedCitizenPhone?: string;
}
