import Link from "next/link";
import { cn } from "@/lib/utils";

/** Typographic wordmark — no sports-equipment iconography by design. */
export function Wordmark({ className, href = "/", inverse = false }: { className?: string; href?: string; inverse?: boolean }) {
  return (
    <Link
      href={href}
      aria-label="Pochi Ma Buoni — home"
      className={cn("group inline-flex items-baseline gap-2 font-serif text-[1.35rem] leading-none tracking-[0.2em]", inverse ? "text-paper" : "text-ink", className)}
    >
      <span>POCHI</span>
      <span className="text-[0.9rem] italic tracking-normal text-steel">ma</span>
      <span>BUONI</span>
    </Link>
  );
}
