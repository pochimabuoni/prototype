import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { signOut } from "@/actions/auth";
import { AppNav } from "./app-nav";

export function AppHeader({
  showNav = true,
  isAdmin = false,
  unread = 0,
  pendingInvites = 0,
}: {
  showNav?: boolean;
  isAdmin?: boolean;
  unread?: number;
  pendingInvites?: number;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Wordmark href={showNav ? "/home" : "/"} className="text-lg" />
        {showNav ? <AppNav isAdmin={isAdmin} unread={unread} pendingInvites={pendingInvites} /> : null}
        <form action={signOut} className={showNav ? "hidden lg:block" : ""}>
          <button type="submit" className="text-[0.6875rem] uppercase tracking-[0.18em] text-stone hover:text-ink">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}

export function AppMain({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <main id="main" className={`mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8 md:py-14 ${className}`}>
      {children}
    </main>
  );
}

export function AppPageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-10 flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="display mt-3 text-4xl sm:text-5xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex gap-3">{actions}</div> : null}
    </div>
  );
}

export function SimpleFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-wrap gap-x-6 gap-y-2 px-5 py-6 text-[0.6875rem] uppercase tracking-[0.16em] text-stone sm:px-8">
        <span>Pochi Ma Buoni</span>
        <Link href="/terms" className="hover:text-ink">Terms</Link>
        <Link href="/privacy" className="hover:text-ink">Privacy</Link>
        <Link href="/contact" className="hover:text-ink">Contact</Link>
        <span className="ml-auto normal-case tracking-normal">Members arrange play at independent venues. In an emergency, call 911.</span>
      </div>
    </footer>
  );
}
