"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MobileNav({ items, inverse = false }: { items: readonly { href: string; label: string }[]; inverse?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
        className={`p-2 ${inverse && !open ? "text-paper" : "text-ink"} relative z-50`}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open ? (
        <div id="mobile-nav" className="fixed inset-0 z-40 flex flex-col bg-paper px-6 pb-10 pt-24 animate-fade-in">
          <nav aria-label="Mobile" className="flex flex-col">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-border py-4 font-serif text-3xl text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Button asChild className="mt-auto w-full" size="lg">
            <Link href="/apply" onClick={() => setOpen(false)}>
              Apply for membership
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
