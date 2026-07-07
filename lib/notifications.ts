import { addDoc, arrayUnion, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { Department, Role } from "./types";

export interface NotificationDoc {
  id: string;
  complaintId: string;
  message: string;
  createdAt: string;
  forRole: Role;
  department?: Department;
  ward?: string;
  citizenId?: string;
  readBy: string[];
}

// Written at the moment something actually happens — submission, a status
// change, a remark — never on a timer. There's no scheduler checking SLA
// crossings in the background; that would need paid infra (Cloud Scheduler
// or Vercel Cron beyond its free-tier granularity), so time-based alerts
// ("nearing SLA", "just escalated") aren't included here on purpose.
export async function notify(data: {
  complaintId: string;
  message: string;
  forRole: Role;
  department?: Department;
  ward?: string;
  citizenId?: string;
}) {
  await addDoc(collection(db, "notifications"), {
    ...data,
    createdAt: new Date().toISOString(),
    readBy: [],
  });
}

export async function markNotificationRead(notificationId: string, uid: string) {
  await updateDoc(doc(db, "notifications", notificationId), {
    readBy: arrayUnion(uid),
  });
}
