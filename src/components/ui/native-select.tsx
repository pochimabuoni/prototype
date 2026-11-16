import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Accessible native <select> styled to match the design system (mobile-friendly). */
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(
          "h-11 w-full appearance-none border-0 border-b border-input bg-transparent py-2 pr-8 text-base text-ink focus-visible:border-ink focus-visible:outline-none disabled:opacity-50 aria-invalid:border-destructive md:text-sm",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-1 top-1/2 size-4 -translate-y-1/2 text-stone" />
    </div>
  );
}

export { NativeSelect };
