import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";

export const PUBLIC_NAV = [
  { href: "/philosophy", label: "Philosophy" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/venues", label: "Venues" },
  { href: "/membership", label: "Membership" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader({ inverse = false }: { inverse?: boolean }) {
  return (
    <header className={inverse ? "absolute inset-x-0 top-0 z-40 text-paper" : "sticky top-0 z-40 border-b border-border bg-paper"}>
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Wordmark inverse={inverse} />
        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          {PUBLIC_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[0.75rem] uppercase tracking-[0.18em] transition-opacity hover:opacity-60 ${inverse ? "text-paper" : "text-ink"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-5 lg:flex">
          <Link href="/sign-in" className={`text-[0.75rem] uppercase tracking-[0.18em] hover:opacity-60 ${inverse ? "text-paper" : "text-ink"}`}>
            Sign in
          </Link>
          <Button asChild size="sm" variant={inverse ? "inverse" : "default"}>
            <Link href="/apply">Apply</Link>
          </Button>
        </div>
        <MobileNav inverse={inverse} items={[...PUBLIC_NAV, { href: "/application-status", label: "Application status" }, { href: "/sign-in", label: "Sign in" }]} />
      </div>
    </header>
  );
}
