import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { Complaint, Status } from "./types";

export async function updateComplaintStatus(
  complaint: Complaint,
  newStatus: Status,
  updatedBy: string,
  extra?: { note?: string; proofImageUrls?: string[] }
) {
  const now = new Date().toISOString();
  await updateDoc(doc(db, "complaints", complaint.id), {
    status: newStatus,
    updatedAt: now,
    history: [
      ...complaint.history,
      { status: newStatus, updatedBy, updatedAt: now, ...extra },
    ],
  });
}
