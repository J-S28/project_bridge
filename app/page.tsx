import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-12 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Project Bridge</h1>
        <p className="mt-2 text-neutral-500">
          AI-powered citizen participation and governance platform
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
        <Link
          href="/signup/citizen"
          className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-8 text-left transition hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
        >
          <span className="text-lg font-medium">I&apos;m a Citizen</span>
          <span className="text-sm text-neutral-500">
            Report civic issues and track their resolution.
          </span>
        </Link>

        <Link
          href="/signup/official"
          className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-8 text-left transition hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
        >
          <span className="text-lg font-medium">I&apos;m a Government Official</span>
          <span className="text-sm text-neutral-500">
            Department officers, MLAs, and MPs manage and review complaints.
          </span>
        </Link>
      </div>

      <p className="text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Log in
        </Link>
      </p>
    </main>
  );
}
