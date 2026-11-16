"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/sports", label: "Sports" },
  { href: "/admin/referrals", label: "Referral codes" },
  { href: "/admin/settings", label: "Matching" },
  { href: "/admin/audit", label: "Audit log" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Administration" className="flex gap-1 overflow-x-auto border-b border-border pb-2 lg:flex-col lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
      <p className="eyebrow mb-3 hidden lg:block">Administration</p>
      {ITEMS.map((i) => {
        const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={cn("whitespace-nowrap px-3 py-2 text-sm transition-colors lg:px-0", active ? "text-ink lg:font-medium" : "text-stone hover:text-ink")}
          >
            {active ? <span aria-hidden className="mr-2 hidden text-gold lg:inline">—</span> : null}
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
