import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 border-0 border-b border-input bg-transparent px-0 py-2 text-base text-ink placeholder:text-stone/70 transition-colors focus-visible:border-ink focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive file:mr-4 file:border-0 file:bg-linen file:px-3 file:py-1.5 file:text-xs file:uppercase file:tracking-widest md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
