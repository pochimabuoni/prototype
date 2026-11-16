import type { Metadata } from "next";
import { PageIntro } from "@/components/site/page-intro";
import { BRAND } from "@/lib/domain/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Pochi Ma Buoni membership team.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || BRAND.contactEmail;
  return (
    <>
      <PageIntro eyebrow="Contact" title="We read every note." lede={<p>For membership questions, press or partnerships, write to us and a member of the team will reply.</p>} />
      <section className="mx-auto grid max-w-7xl gap-px border-y border-border bg-border px-0 sm:grid-cols-3">
        {[
          { label: "Membership", value: email, href: `mailto:${email}` },
          { label: "Members", value: "Use in-app messages or report tools for anything about another member.", href: undefined },
          { label: "Based in", value: "New York City", href: undefined },
        ].map((c) => (
          <div key={c.label} className="bg-paper p-8 sm:p-10">
            <p className="eyebrow">{c.label}</p>
            {c.href ? (
              <a href={c.href} className="mt-4 block font-serif text-2xl underline-offset-4 hover:underline">
                {c.value}
              </a>
            ) : (
              <p className="mt-4 font-serif text-2xl">{c.value}</p>
            )}
          </div>
        ))}
      </section>
      <div className="h-24" />
    </>
  );
}
