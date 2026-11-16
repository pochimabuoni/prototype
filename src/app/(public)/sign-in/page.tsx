import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Alert } from "@/components/ui/alert";
import { getViewer } from "@/lib/auth/viewer";
import { homeForStage, safeNextPath } from "@/lib/auth/stage";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Pochi Ma Buoni with a secure email link.",
  alternates: { canonical: "/sign-in" },
};

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? safeNextPath(params.next, "") : "";
  const viewer = await getViewer();
  if (viewer) redirect(next || homeForStage(viewer.stage));

  return (
    <section className="mx-auto grid max-w-7xl gap-16 px-5 py-16 sm:px-8 md:grid-cols-2 md:py-28">
      <div>
        <p className="eyebrow">Members &amp; applicants</p>
        <h1 className="display mt-6 text-5xl sm:text-6xl">Sign in</h1>
        <p className="mt-6 max-w-md text-lg text-graphite/80">
          We use secure, password-free sign-in. Enter the email address you applied with and we&apos;ll send you a link.
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          Not yet a member?{" "}
          <Link href="/apply" className="underline underline-offset-4">
            Apply for membership
          </Link>
          .
        </p>
      </div>
      <div className="border border-border bg-card p-8 sm:p-10">
        {params.error === "link" ? (
          <Alert variant="destructive" className="mb-6">
            That sign-in link is invalid or has expired. Please request a new one.
          </Alert>
        ) : null}
        <SignInForm next={next || undefined} />
      </div>
    </section>
  );
}
