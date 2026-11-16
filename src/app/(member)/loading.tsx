import { Skeleton } from "@/components/ui/skeleton";
import { AppMain } from "@/components/app/app-header";

export default function Loading() {
  return (
    <AppMain>
      <div role="status" aria-label="Loading">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-12 w-80 max-w-full" />
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    </AppMain>
  );
}
