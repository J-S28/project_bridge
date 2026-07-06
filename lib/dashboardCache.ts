import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// Caches Gemini-generated dashboard content (AI insight, priority ranking) in
// Firestore, keyed by scope (ward/constituency) + complaint count. Avoids
// re-calling Gemini on every dashboard visit when nothing has changed since
// the last generation — cuts API usage and makes repeat visits instant.
export async function getCached<T>(
  cacheKey: string,
  currentComplaintCount: number
): Promise<T | null> {
  const snap = await getDoc(doc(db, "dashboardCache", cacheKey));
  if (!snap.exists()) return null;

  const data = snap.data();
  if (data.complaintCount !== currentComplaintCount) return null;

  return data.result as T;
}

export async function setCached<T>(
  cacheKey: string,
  complaintCount: number,
  result: T
): Promise<void> {
  await setDoc(doc(db, "dashboardCache", cacheKey), {
    complaintCount,
    result,
    updatedAt: new Date().toISOString(),
  });
}
