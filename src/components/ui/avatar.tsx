import Image from "next/image";
import { cn } from "@/lib/utils";

/** Member portrait. Falls back to monogram initials (no cartoon placeholders). */
export function Avatar({
  src,
  name,
  size = 48,
  className,
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-linen text-graphite", className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={`Portrait of ${name}`} fill sizes={`${size}px`} className="object-cover grayscale-[15%]" unoptimized />
      ) : (
        <span aria-hidden className="font-serif" style={{ fontSize: size * 0.38 }}>
          {initials}
        </span>
      )}
    </span>
  );
}
