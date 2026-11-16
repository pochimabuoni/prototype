"use client";

import { Button } from "@/components/ui/button";

export default function MemberError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 py-20 sm:px-8">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="display mt-4 text-4xl">We couldn&apos;t load this page.</h1>
      <p className="mt-4 text-muted-foreground">Please try again. If the problem continues, contact the membership team.</p>
      <Button className="mt-8" onClick={reset}>Try again</Button>
    </main>
  );
}
