"use client";

import { useRef, useState } from "react";
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
import { notify } from "@/lib/notifications";
import {
  STATES,
  WARDS_BY_STATE,
  MP_CONSTITUENCY_BY_WARD,
  findNearestWard,
  districtForWard,
  type StateName,
} from "@/lib/wards";
import type { AIClassification, Complaint } from "@/lib/types";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function SubmitComplaintForm() {
  const { appUser } = useAuth();

  const [complaintType, setComplaintType] = useState<"Grievance" | "Suggestion">(
    "Grievance"
  );
  const [text, setText] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locating, setLocating] = useState(false);
  const [address, setAddress] = useState("");
  const [state, setState] = useState<StateName>(STATES[0]);
  const [ward, setWard] = useState(WARDS_BY_STATE[STATES[0]][0]);

  function handleStateChange(next: StateName) {
    setState(next);
    setWard(WARDS_BY_STATE[next][0]);
  }

  const [classification, setClassification] = useState<AIClassification | null>(
    null
  );
  const [duplicateOfId, setDuplicateOfId] = useState<string | null>(null);
  const [joinedReportCount, setJoinedReportCount] = useState<number | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleRecording() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Voice recording isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        setTranscribing(true);
        setError(null);

        try {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const audioBase64 = await blobToBase64(blob);

          const res = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioBase64, mimeType }),
          });
          if (!res.ok) throw new Error("Transcription failed");

          const { transcript, language } = await res.json();
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setDetectedLanguage(language);
        } catch {
          setError("Couldn't transcribe that recording. Try again.");
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone permission denied.");
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setPhotoDataUrl(dataUrl);
    } catch {
      setError("Couldn't process that photo. Try a different one.");
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation isn't supported in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });

        const nearest = findNearestWard(lat, lng);
        setState(nearest.state);
        setWard(nearest.ward);

        setLocating(false);
      },
      () => {
        setError("Couldn't get your location. You can still submit without it.");
        setLocating(false);
      }
    );
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
      setError("Describe the issue first.");
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
          ...(location ?? { lat: 0, lng: 0 }),
          state,
          district: districtForWard(ward),
          ward,
          constituencyMP: MP_CONSTITUENCY_BY_WARD[ward],
          ...(address.trim() ? { address: address.trim() } : {}),
        },
        ai: classification,
        status: "Submitted",
        history: [
          { status: "Submitted", updatedBy: appUser.uid, updatedAt: now },
        ],
        createdAt: now,
        updatedAt: now,
        clusterId: newRef.id,
        reportCount: 1,
        reportedByCitizenIds: [appUser.uid],
        source: "Citizen App",
      };

      await setDoc(newRef, complaint);
      // Best-effort: a notification failure must never make a successful
      // submission look like it failed.
      notify({
        complaintId: newRef.id,
        message: `New ${complaint.type.toLowerCase()}: ${classification.summary}`,
        forRole: "officer",
        department: classification.department,
        ward,
      }).catch(() => {});
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
            <h1 className="text-2xl font-semibold">You&apos;ve been added to this report</h1>
            <p className="text-neutral-500">
              {joinedReportCount} {joinedReportCount === 1 ? "person has" : "people have"}{" "}
              now reported this issue — it&apos;s tracked as one case, not a duplicate ticket.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Complaint submitted</h1>
            <p className="text-neutral-500">
              Department: {classification?.department} · Priority:{" "}
              {classification?.priority}
            </p>
          </>
        )}
        <Link
          href="/citizen"
          className="mt-2 rounded-full bg-foreground px-5 py-2 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-8">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-semibold">Report a civic issue</h1>

        <div className="mt-6 flex flex-col gap-4">
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
            Describe the issue
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="e.g. There's a large pothole on the main road near the bus stop..."
              className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={toggleRecording}
              disabled={transcribing}
              className={`rounded-full border px-4 py-2 text-sm disabled:opacity-50 ${
                recording
                  ? "border-red-500 text-red-600"
                  : "border-neutral-300 dark:border-neutral-700"
              }`}
            >
              {transcribing
                ? "Transcribing…"
                : recording
                  ? "Stop recording"
                  : "🎤 Speak (any language)"}
            </button>
            {detectedLanguage && (
              <span className="text-sm text-neutral-500">
                Detected: {detectedLanguage}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="rounded-full border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700">
              📷 Add photo
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-neutral-700"
            >
              {locating
                ? "Getting location…"
                : location
                  ? "📍 Location set"
                  : "📍 Use my location"}
            </button>
          </div>

          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              State
              <select
                value={state}
                onChange={(e) => handleStateChange(e.target.value as StateName)}
                className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
              >
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-1 flex-col gap-1 text-sm">
              Ward
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
              >
                {WARDS_BY_STATE[state].map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="-mt-2 text-xs text-neutral-400">
            Auto-filled from your location — change it if reporting on behalf of
            a different area.
          </p>

          <label className="flex flex-col gap-1 text-sm">
            Address (optional — e.g. if reporting on behalf of a different area)
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Near Ward 9 community hall, Malkajgiri"
              className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
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
              <h2 className="font-medium">AI classification preview</h2>
              {duplicateOfId && (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  This looks like the same issue as one already reported nearby.
                  Confirming will add your report to that existing case instead
                  of creating a new one.
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
                <dt className="text-neutral-500">Sentiment</dt>
                <dd>{classification.sentiment}</dd>
                <dt className="text-neutral-500">Summary</dt>
                <dd>{classification.summary}</dd>
                {classification.escalateToRepresentative && (
                  <>
                    <dt className="text-neutral-500">Needs rep. attention</dt>
                    <dd>{classification.escalationReason}</dd>
                  </>
                )}
              </dl>

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
                  {submitting
                    ? "Submitting…"
                    : duplicateOfId
                      ? "Confirm — add my report"
                      : "Confirm & submit"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function SubmitComplaintPage() {
  return (
    <RoleGuard requiredRole="citizen">
      <SubmitComplaintForm />
    </RoleGuard>
  );
}
