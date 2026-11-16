"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/actions/auth";

export function AppNav({ isAdmin, unread, pendingInvites }: { isAdmin: boolean; unread: number; pendingInvites: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = [
    { href: "/home", label: "Home" },
    { href: "/discover", label: "Discover" },
    { href: "/connections", label: "Connections" },
    { href: "/invitations", label: "Invitations", count: pendingInvites },
    { href: "/messages", label: "Messages", count: unread },
    { href: "/profile", label: "Profile" },
    { href: "/settings", label: "Settings" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav aria-label="Member" className="hidden items-center gap-6 lg:flex">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "relative py-1 text-[0.6875rem] uppercase tracking-[0.18em] transition-colors",
              isActive(item.href) ? "text-ink after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-ink" : "text-stone hover:text-ink",
            )}
          >
            {item.label}
            {item.count ? (
              <span className="ml-1.5 inline-flex min-w-4 items-center justify-center bg-steel px-1 text-[0.5625rem] leading-4 text-paper">
                {item.count > 99 ? "99+" : item.count}
                <span className="sr-only"> new</span>
              </span>
            ) : null}
          </Link>
        ))}
      </nav>
      <div className="lg:hidden">
        <button type="button" aria-expanded={open} aria-controls="app-mobile-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)} className="relative z-50 p-2">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
          {!open && unread + pendingInvites > 0 ? <span aria-hidden className="absolute right-1 top-1 size-2 rounded-full bg-steel" /> : null}
        </button>
        {open ? (
          <div id="app-mobile-nav" className="fixed inset-0 z-40 flex flex-col bg-paper px-6 pb-8 pt-20 animate-fade-in">
            <nav aria-label="Member mobile" className="flex flex-col">
              {items.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex items-center justify-between border-b border-border py-4 font-serif text-3xl">
                  {item.label}
                  {item.count ? <span className="font-sans text-sm text-steel">{item.count}</span> : null}
                </Link>
              ))}
            </nav>
            <form action={signOut} className="mt-auto">
              <button type="submit" className="text-xs uppercase tracking-[0.18em] text-stone">Sign out</button>
            </form>
          </div>
        ) : null}
      </div>
    </>
  );
}
