import { Alert } from "@/components/ui/alert";

export function LegalDocument({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8 md:py-24">
      <p className="eyebrow">Legal · Draft</p>
      <h1 className="display mt-6 text-5xl sm:text-6xl">{title}</h1>
      <p className="mt-4 text-sm text-muted-foreground">Draft prepared {updated}. Not yet in effect.</p>
      <Alert variant="steel" className="mt-8">
        <strong className="font-medium">Draft for legal review.</strong> This document is a working draft prepared for review by
        qualified counsel. It is not a final, approved legal document and should not be relied upon as such. Placeholder
        wording is marked in [square brackets].
      </Alert>
      <div className="legal mt-12 space-y-8 text-[0.975rem] leading-relaxed text-graphite [&_h2]:mt-12 [&_h2]:font-serif [&_h2]:text-3xl [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:space-y-2">
        {children}
      </div>
    </article>
  );
}
