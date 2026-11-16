import { Skeleton } from "@/components/ui/skeleton";
import { AppMain } from "@/components/app/app-header";

export default function Loading() {
  return (
    <AppMain>
      <Skeleton className="h-10 w-72" />
      <Skeleton className="mt-4 h-5 w-96 max-w-full" />
      <Skeleton className="mt-10 h-24 w-full" />
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72" />
        ))}
      </div>
    </AppMain>
  );
}
