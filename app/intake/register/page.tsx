"use client";

import { useState } from "react";
import Link from "next/link";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { RoleGuard } from "@/components/RoleGuard";
import { compressImageToDataUrl } from "@/lib/compressImage";
import { MP_CONSTITUENCY_BY_WARD, wardsInMPConstituency } from "@/lib/wards";
import type { AIClassification, Complaint, ComplaintSource } from "@/lib/types";

const SOURCES: ComplaintSource[] = [
  "Public Meeting",
  "Walk-in",
  "Letter",
  "Phone Call",
  "Email",
  "WhatsApp",
  "Existing Government Portal",
];

function RegisterComplaintForm() {
  const { appUser } = useAuth();

  const isMpOffice = appUser?.officeType === "mp";
  const wardOptions = isMpOffice
    ? wardsInMPConstituency(appUser?.constituency ?? "")
    : [appUser?.constituency ?? ""];

  const [source, setSource] = useState<ComplaintSource>(SOURCES[0]);
  const [ward, setWard] = useState(wardOptions[0] ?? "");
  const [complaintType, setComplaintType] = useState<"Grievance" | "Suggestion">(
    "Grievance"
  );
  const [text, setText] = useState("");
  const [address, setAddress] = useState("");
  const [citizenName, setCitizenName] = useState("");
  const [citizenPhone, setCitizenPhone] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  const [classification, setClassification] = useState<AIClassification | null>(
    null
  );
  const [duplicateOfId, setDuplicateOfId] = useState<string | null>(null);
  const [joinedReportCount, setJoinedReportCount] = useState<number | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhotoDataUrl(await compressImageToDataUrl(file));
    } catch {
      setError("Couldn't process that photo. Try a different one.");
    }
  }

  async function fetchNearbyComplaints(forWard: string) {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const snap = await getDocs(
      query(collection(db, "complaints"), where("location.ward", "==", forWard))
    );
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Complaint)
      .filter(
        (c) =>
          new Date(c.createdAt).getTime() >= thirtyDaysAgo &&
          !["Resolved", "Closed"].includes(c.status)
      )
      .slice(0, 20)
      .map((c) => ({ id: c.id, summary: c.ai.summary, category: c.ai.category }));
  }

  async function handlePreview() {
    if (!text.trim()) {
      setError("Describe the complaint first.");
      return;
    }
    setError(null);
    setClassifying(true);
    setClassification(null);
    setDuplicateOfId(null);

    try {
      const nearbyComplaints = await fetchNearbyComplaints(ward);
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, nearbyComplaints }),
      });
      if (!res.ok) throw new Error("Classification failed");
      const data = await res.json();
      setClassification(data);
      setDuplicateOfId(data.duplicateOfId || null);
    } catch {
      setError("Couldn't classify this complaint. Try again.");
    } finally {
      setClassifying(false);
    }
  }

  async function handleConfirmSubmit() {
    if (!appUser || !classification) return;
    setSubmitting(true);
    setError(null);

    try {
      if (duplicateOfId) {
        const existingSnap = await getDoc(doc(db, "complaints", duplicateOfId));
        const existing = existingSnap.data() as Complaint | undefined;

        await updateDoc(doc(db, "complaints", duplicateOfId), {
          reportCount: increment(1),
          reportedByCitizenIds: arrayUnion(appUser.uid),
          updatedAt: new Date().toISOString(),
        });

        setJoinedReportCount((existing?.reportCount ?? 1) + 1);
        setSubmitted(true);
        return;
      }

      const now = new Date().toISOString();
      const newRef = doc(collection(db, "complaints"));
      const complaint: Complaint = {
        id: newRef.id,
        citizenId: appUser.uid,
        type: complaintType,
        rawText: text,
        imageUrls: photoDataUrl ? [photoDataUrl] : [],
        location: {
          lat: 0,
          lng: 0,
          state: appUser.state,
          ward,
          constituencyMP: MP_CONSTITUENCY_BY_WARD[ward],
          ...(address.trim() ? { address: address.trim() } : {}),
        },
        ai: classification,
        status: "Submitted",
        history: [{ status: "Submitted", updatedBy: appUser.uid, updatedAt: now }],
        createdAt: now,
        updatedAt: now,
        clusterId: newRef.id,
        reportCount: 1,
        reportedByCitizenIds: [appUser.uid],
        source,
        loggedByRole: "office_staff",
        loggedByName: appUser.name,
        ...(citizenName.trim() ? { reportedCitizenName: citizenName.trim() } : {}),
        ...(citizenPhone.trim() ? { reportedCitizenPhone: citizenPhone.trim() } : {}),
      };

      await setDoc(newRef, complaint);
      setSubmitted(true);
    } catch {
      setError("Couldn't submit this complaint. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        {duplicateOfId ? (
          <>
            <h1 className="text-2xl font-semibold">Added to an existing report</h1>
            <p className="text-neutral-500">
              {joinedReportCount} reports now linked to this same issue.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Complaint registered</h1>
            <p className="text-neutral-500">
              Department: {classification?.department} · Priority:{" "}
              {classification?.priority}
            </p>
          </>
        )}
        <Link
          href="/intake"
          className="mt-2 rounded-full bg-foreground px-5 py-2 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Back to intake dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-8">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-semibold">Register a complaint</h1>
        <p className="mt-1 text-sm text-neutral-500">
          For grievances received offline — letters, calls, meetings, walk-ins.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Source
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as ComplaintSource)}
              className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-4 text-sm">
            {(["Grievance", "Suggestion"] as const).map((t) => (
              <label key={t} className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={complaintType === t}
                  onChange={() => setComplaintType(t)}
                />
                {t}
              </label>
            ))}
          </div>

          <label className="flex flex-col gap-1 text-sm">
            Complaint description
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Write down what the citizen described..."
              className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Ward
            {isMpOffice ? (
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
              >
                {wardOptions.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            ) : (
              <input
                disabled
                value={`${ward} (your assigned ward)`}
                className="rounded-md border border-neutral-300 bg-neutral-100 px-3 py-2 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
              />
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Address / Landmark (optional)
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Near Ward 9 community hall"
              className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>

          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              Citizen name (optional)
              <input
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm">
              Contact number (optional)
              <input
                value={citizenPhone}
                onChange={(e) => setCitizenPhone(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
          </div>

          <label className="rounded-full border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700 self-start">
            📷 Attach photo/document
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>

          {photoDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoDataUrl}
              alt="Attached"
              className="h-40 w-auto rounded-md border border-neutral-200 object-cover dark:border-neutral-800"
            />
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {!classification ? (
            <button
              type="button"
              onClick={handlePreview}
              disabled={classifying}
              className="rounded-full bg-foreground px-5 py-2 text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
            >
              {classifying ? "Classifying…" : "Preview AI classification"}
            </button>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
              <h2 className="font-medium">AI classification (read-only)</h2>
              {duplicateOfId && (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  This matches an existing open complaint in this ward. Confirming
                  will add to its report count instead of creating a new case.
                </p>
              )}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <dt className="text-neutral-500">Department</dt>
                <dd>{classification.department}</dd>
                <dt className="text-neutral-500">Category</dt>
                <dd>
                  {classification.category} / {classification.subcategory}
                </dd>
                <dt className="text-neutral-500">Priority</dt>
                <dd>{classification.priority}</dd>
                <dt className="text-neutral-500">Summary</dt>
                <dd>{classification.summary}</dd>
              </dl>
              <p className="text-xs text-neutral-400">
                Department, priority, and category are set by AI and can&apos;t be
                overridden manually.
              </p>

              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setClassification(null)}
                  className="rounded-full border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={submitting}
                  className="rounded-full bg-foreground px-5 py-2 text-sm text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
                >
                  {submitting ? "Submitting…" : "Confirm & register"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function RegisterComplaintPage() {
  return (
    <RoleGuard requiredRole="office_staff">
      <RegisterComplaintForm />
    </RoleGuard>
  );
}
