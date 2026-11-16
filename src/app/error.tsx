"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Safe error boundary: never shows internal error details to users. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="mx-auto flex max-w-2xl flex-1 flex-col items-start justify-center px-5 py-24 sm:px-8">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="display mt-6 text-5xl">A brief interruption.</h1>
      <p className="mt-6 text-lg text-graphite/80">We couldn&apos;t load this page. Please try again in a moment.</p>
      {error.digest ? <p className="mt-2 font-mono text-xs text-stone">Reference: {error.digest}</p> : null}
      <div className="mt-10 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline"><Link href="/">Home</Link></Button>
      </div>
    </main>
  );
}
