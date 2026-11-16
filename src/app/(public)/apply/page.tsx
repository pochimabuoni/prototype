import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ApplicationForm } from "@/components/apply/application-form";
import { getActiveSports } from "@/lib/data/sports";
import { getViewer } from "@/lib/auth/viewer";
import { homeForStage } from "@/lib/auth/stage";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Apply for Membership",
  description: "Apply to join Pochi Ma Buoni, a private sports community in New York City.",
  alternates: { canonical: "/apply" },
};

export default async function ApplyPage() {
  const [viewer, sports] = await Promise.all([getViewer(), getActiveSports()]);
  if (viewer && viewer.stage !== "NO_APPLICATION" && viewer.stage !== "APPLICATION_REJECTED") {
    redirect(homeForStage(viewer.stage));
  }
  return (
    <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 md:py-24">
      <p className="eyebrow">Membership application</p>
      <h1 className="display mt-6 text-5xl sm:text-6xl">Apply to join.</h1>
      <p className="mt-6 max-w-2xl text-lg text-graphite/80">
        Every application is read by a person. Please be yourself — we&apos;re looking for good company and genuine enthusiasm at
        every level of play.
      </p>
      <div className="mt-16">
        {sports.length === 0 ? (
          <Alert variant="destructive">Applications are temporarily unavailable. Please try again shortly.</Alert>
        ) : (
          <ApplicationForm sports={sports} defaultEmail={viewer?.email} />
        )}
      </div>
    </div>
  );
}
