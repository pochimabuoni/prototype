import { cn } from "@/lib/utils";

export function PageIntro({
  eyebrow,
  title,
  lede,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mx-auto max-w-7xl px-5 pb-12 pt-16 sm:px-8 md:pb-20 md:pt-24", className)}>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="display mt-6 max-w-4xl text-5xl sm:text-6xl md:text-7xl">{title}</h1>
      {lede ? <div className="mt-8 max-w-2xl text-lg leading-relaxed text-graphite/80">{lede}</div> : null}
    </section>
  );
}
