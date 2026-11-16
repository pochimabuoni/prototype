import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { BRAND } from "@/lib/domain/constants";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Wordmark inverse />
          <p className="max-w-xs text-sm leading-relaxed text-paper/60">
            <span className="italic font-serif text-base text-paper/80">{BRAND.meaning}.</span> A private members&apos; community
            for people who play, in {BRAND.city}.
          </p>
        </div>
        <FooterColumn
          title="The club"
          links={[
            { href: "/philosophy", label: "Our philosophy" },
            { href: "/how-it-works", label: "How it works" },
            { href: "/membership", label: "Membership" },
          ]}
        />
        <FooterColumn
          title="Members"
          links={[
            { href: "/apply", label: "Apply" },
            { href: "/application-status", label: "Application status" },
            { href: "/sign-in", label: "Sign in" },
          ]}
        />
        <FooterColumn
          title="Company"
          links={[
            { href: "/contact", label: "Contact" },
            { href: "/privacy", label: "Privacy policy" },
            { href: "/terms", label: "Terms of service" },
          ]}
        />
      </div>
      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-[0.6875rem] uppercase tracking-[0.18em] text-paper/40 sm:flex-row sm:justify-between sm:px-8">
          <span>© {new Date().getFullYear()} {BRAND.name}. New York.</span>
          <span>Members arrange play at independent public and private venues.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[0.6875rem] uppercase tracking-[0.22em] text-paper/40">{title}</p>
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="text-sm text-paper/80 transition-colors hover:text-paper">
          {l.label}
        </Link>
      ))}
    </div>
  );
}
