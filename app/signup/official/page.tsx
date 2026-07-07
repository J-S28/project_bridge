"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { DEPARTMENTS } from "@/lib/departments";
import {
  STATES,
  WARDS_BY_STATE,
  MP_CONSTITUENCIES,
  stateForMPConstituency,
  type StateName,
  type MPConstituency,
} from "@/lib/wards";
import type { AppUser, OfficeType, Role } from "@/lib/types";

type OfficialType = Extract<
  Role,
  "officer" | "department_head" | "mla" | "mp" | "office_staff"
>;

export default function OfficialSignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [officialType, setOfficialType] = useState<OfficialType>("officer");
  const [officeType, setOfficeType] = useState<OfficeType>("department");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [state, setState] = useState<StateName>(STATES[0]);
  const [ward, setWard] = useState(WARDS_BY_STATE[STATES[0]][0]);
  const [mpConstituency, setMpConstituency] = useState<MPConstituency>(
    MP_CONSTITUENCIES[0]
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleStateChange(next: StateName) {
    setState(next);
    setWard(WARDS_BY_STATE[next][0]);
  }

  // For office_staff, treat their chosen officeType the same as the
  // matching official role for the purposes of which fields to show.
  const effectiveType: OfficialType =
    officialType === "office_staff"
      ? officeType === "department"
        ? "officer"
        : officeType === "mla"
          ? "mla"
          : "mp"
      : officialType;

  const showDepartment = effectiveType === "officer" || effectiveType === "department_head";
  const showWard = effectiveType === "officer" || effectiveType === "mla";
  const showConstituency = effectiveType === "department_head" || effectiveType === "mp";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);

      const usesMPConstituency = showConstituency;

      const appUser: AppUser = {
        uid: credential.user.uid,
        email,
        name,
        role: officialType,
        state: usesMPConstituency ? stateForMPConstituency(mpConstituency) : state,
        createdAt: new Date().toISOString(),
        ...(officialType === "office_staff" ? { officeType } : {}),
        ...(showDepartment ? { department } : {}),
        ...(showWard ? { constituency: ward } : {}),
        ...(showConstituency ? { constituency: mpConstituency } : {}),
      };

      await setDoc(doc(db, "users", credential.user.uid), appUser);
      router.push(
        officialType === "department_head"
          ? "/department-head"
          : officialType === "office_staff"
            ? "/intake"
            : `/${officialType}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-neutral-200 p-8 dark:border-neutral-800"
      >
        <h1 className="text-xl font-semibold">Government official sign up</h1>

        <label className="flex flex-col gap-1 text-sm">
          Full name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Official type
          <select
            value={officialType}
            onChange={(e) => setOfficialType(e.target.value as OfficialType)}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="officer">Department Officer</option>
            <option value="department_head">Department Executive</option>
            <option value="mla">MLA</option>
            <option value="mp">MP</option>
            <option value="office_staff">Grievance Intake Officer</option>
          </select>
        </label>

        {officialType === "office_staff" && (
          <label className="flex flex-col gap-1 text-sm">
            Attached to
            <select
              value={officeType}
              onChange={(e) => setOfficeType(e.target.value as OfficeType)}
              className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="department">Department Office</option>
              <option value="mla">MLA Office</option>
              <option value="mp">MP Office</option>
            </select>
          </label>
        )}

        {showDepartment && (
          <label className="flex flex-col gap-1 text-sm">
            Department
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as typeof department)}
              className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </label>
        )}

        {showWard && (
          <label className="flex flex-col gap-1 text-sm">
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
        )}

        {showWard && (
          <label className="flex flex-col gap-1 text-sm">
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
        )}

        {showConstituency && (
          <label className="flex flex-col gap-1 text-sm">
            Constituency
            <select
              value={mpConstituency}
              onChange={(e) => setMpConstituency(e.target.value as MPConstituency)}
              className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            >
              {MP_CONSTITUENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-foreground px-5 py-2 text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {submitting ? "Creating account…" : "Sign up"}
        </button>

        <p className="text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="underline underline-offset-4">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}
