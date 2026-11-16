import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/domain/constants";

export const metadata: Metadata = { title: "Membership suspended", robots: { index: false } };

export default function SuspendedPage() {
  return (
    <section className="mx-auto max-w-2xl px-5 py-24 sm:px-8">
      <p className="eyebrow">Account</p>
      <h1 className="display mt-6 text-5xl">Your membership is suspended.</h1>
      <p className="mt-6 text-lg text-graphite/80">
        Access to the community has been paused by our team. If you believe this is a mistake, please write to{" "}
        <a className="underline underline-offset-4" href={`mailto:${BRAND.contactEmail}`}>
          {BRAND.contactEmail}
        </a>
        .
      </p>
      <Link href="/" className="mt-10 inline-block text-sm uppercase tracking-[0.16em] underline-offset-4 hover:underline">
        Return home
      </Link>
    </section>
  );
}
