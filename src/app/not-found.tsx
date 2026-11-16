import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex max-w-2xl flex-1 flex-col items-start justify-center px-5 py-24 sm:px-8">
      <p className="eyebrow">404</p>
      <h1 className="display mt-6 text-5xl sm:text-6xl">Out of bounds.</h1>
      <p className="mt-6 text-lg text-graphite/80">This page doesn&apos;t exist, or you don&apos;t have access to it.</p>
      <Button asChild className="mt-10"><Link href="/">Return home</Link></Button>
    </main>
  );
}
