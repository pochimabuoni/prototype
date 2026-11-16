"use client";

import * as React from "react";
import { Label as LabelPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn("text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-stone select-none", className)}
      {...props}
    />
  );
}

export { Label };
