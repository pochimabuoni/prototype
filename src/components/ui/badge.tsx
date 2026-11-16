import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 border px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-[0.16em] whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-ink bg-ink text-paper",
        outline: "border-sand text-graphite",
        gold: "border-gold/50 text-gold",
        success: "border-success/40 text-success",
        destructive: "border-destructive/40 text-destructive",
        muted: "border-transparent bg-linen text-graphite",
      },
    },
    defaultVariants: { variant: "outline" },
  },
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
