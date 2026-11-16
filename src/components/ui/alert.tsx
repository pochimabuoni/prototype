import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("border-l-2 px-4 py-3 text-sm", {
  variants: {
    variant: {
      default: "border-ink bg-ivory text-ink",
      steel: "border-steel bg-ivory text-ink",
      destructive: "border-destructive bg-destructive/5 text-destructive",
      success: "border-success bg-success/5 text-success",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div role="status" className={cn(alertVariants({ variant }), className)} {...props} />;
}
