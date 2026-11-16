import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[0.8125rem] font-medium tracking-[0.08em] uppercase transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:size-4 [&_svg]:shrink-0 rounded-[var(--radius)] cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-graphite",
        outline: "border border-ink/80 bg-transparent text-ink hover:bg-ink hover:text-paper",
        inverse: "bg-paper text-ink hover:bg-ivory",
        "outline-inverse": "border border-paper/70 text-paper hover:bg-paper hover:text-ink",
        ghost: "text-ink hover:bg-linen",
        link: "text-ink underline-offset-4 hover:underline normal-case tracking-normal text-sm px-0 h-auto",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-[0.75rem]",
        lg: "h-13 px-8",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
