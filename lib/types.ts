export type Role = "citizen" | "officer" | "department_head" | "mla" | "mp";

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
  department?: Department; // officer/department_head
  state?: string; // officer/department_head/mla/mp
  constituency?: string; // officer/mla: ward name; department_head/mp: constituency name
  createdAt: string;
}

export type Status =
  | "Submitted"
  | "Acknowledged"
  | "In Progress"
  | "Escalated"
  | "Pending Citizen Confirmation"
  | "Reopened"
  | "Resolved"
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
    ward?: string;
    constituencyMLA?: string;
    constituencyMP?: string;
  };
  ai: AIClassification;
  status: Status;
  history: ComplaintHistoryEntry[];
  assignedOfficerId?: string;
  createdAt: string;
  updatedAt: string;
  citizenRating?: number;
  citizenFeedback?: string;
}
