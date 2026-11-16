import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Editorial imagery slot.
 *
 * Production photography must be licensed/commissioned (see README → "Brand
 * assets"). Drop files into /public/editorial/<name>.jpg and pass `photo` to
 * render them. Until then we render restrained line studies of playing
 * surfaces — architectural rather than illustrative, and never cartoonish.
 */
export type ArtVariant = "court" | "pitch" | "track" | "pool" | "green";

export function EditorialArt({
  variant,
  photo,
  alt,
  caption,
  className,
  tone = "dark",
  priority,
}: {
  variant: ArtVariant;
  photo?: string;
  alt: string;
  caption?: string;
  className?: string;
  tone?: "dark" | "light";
  priority?: boolean;
}) {
  const stroke = tone === "dark" ? "#e3eaf5" : "#0d1f3c";
  const bg = tone === "dark" ? "bg-ink" : "bg-linen";
  return (
    <figure className={cn("relative overflow-hidden", bg, className)}>
      {photo ? (
        <Image src={photo} alt={alt} fill priority={priority} sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
      ) : (
        <svg role="img" aria-label={alt} viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
          <g fill="none" stroke={stroke} strokeWidth="1" opacity="0.55">
            {variant === "court" && <CourtLines />}
            {variant === "pitch" && <PitchLines />}
            {variant === "track" && <TrackLines />}
            {variant === "pool" && <PoolLines />}
            {variant === "green" && <GreenLines />}
          </g>
          <rect x="0" y="0" width="400" height="500" fill="url(#grain)" opacity="0.12" />
          <defs>
            <pattern id="grain" width="3" height="3" patternUnits="userSpaceOnUse">
              <rect width="1" height="1" fill={stroke} />
            </pattern>
          </defs>
        </svg>
      )}
      {caption ? (
        <figcaption
          className={cn(
            "absolute bottom-0 left-0 p-5 text-[0.625rem] uppercase tracking-[0.24em]",
            tone === "dark" ? "text-paper/70" : "text-graphite/70",
          )}
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

// Perspective studies — simple geometry, drawn once.
function CourtLines() {
  return (
    <g transform="translate(200 260)">
      <polygon points="-110,-200 110,-200 190,220 -190,220" />
      <polygon points="-82,-200 82,-200 142,220 -142,220" />
      <line x1="-140" y1="-10" x2="140" y2="-10" strokeWidth="1.5" />
      <line x1="-96" y1="-110" x2="96" y2="-110" />
      <line x1="-160" y1="90" x2="160" y2="90" />
      <line x1="0" y1="-110" x2="0" y2="90" />
      <line x1="-150" y1="-14" x2="150" y2="-14" strokeDasharray="2 3" />
    </g>
  );
}
function PitchLines() {
  return (
    <g transform="translate(200 250)">
      <rect x="-170" y="-220" width="340" height="440" />
      <line x1="-170" y1="0" x2="170" y2="0" />
      <circle cx="0" cy="0" r="56" />
      <rect x="-80" y="-220" width="160" height="70" />
      <rect x="-80" y="150" width="160" height="70" />
      <path d="M -36 -150 A 40 40 0 0 0 36 -150" />
      <path d="M -36 150 A 40 40 0 0 1 36 150" />
    </g>
  );
}
function TrackLines() {
  return (
    <g>
      {Array.from({ length: 7 }).map((_, i) => (
        <path key={i} d={`M ${40 + i * 18} 520 C ${40 + i * 18} 240, ${360 - i * 6} 240, ${360 - i * 6} -20`} />
      ))}
    </g>
  );
}
function PoolLines() {
  return (
    <g>
      <rect x="40" y="30" width="320" height="440" />
      {Array.from({ length: 7 }).map((_, i) => (
        <line key={i} x1={80 + i * 40} y1="30" x2={80 + i * 40} y2="470" strokeDasharray={i % 2 ? "4 6" : undefined} />
      ))}
      <line x1="40" y1="70" x2="360" y2="70" />
    </g>
  );
}
function GreenLines() {
  return (
    <g>
      {Array.from({ length: 9 }).map((_, i) => (
        <ellipse key={i} cx="210" cy="260" rx={30 + i * 22} ry={18 + i * 15} />
      ))}
      <line x1="230" y1="260" x2="230" y2="150" />
      <path d="M 230 150 L 262 162 L 230 174" />
    </g>
  );
}
