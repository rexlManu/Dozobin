import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[16px] border border-transparent bg-clip-padding text-sm font-bold whitespace-nowrap transition-[transform,background-color,color,box-shadow,filter] duration-150 ease-bounce outline-none select-none hover:-translate-y-px active:translate-y-px focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[inset_0_-3px_0_rgb(0_0_0/0.18)] hover:brightness-105 active:shadow-[inset_0_-1px_0_rgb(0_0_0/0.18)] disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:opacity-100",
        outline:
          "bg-sunken text-foreground shadow-[inset_0_-3px_0_rgb(0_0_0/0.35),0_0_0_1.5px_var(--border)] hover:bg-accent aria-expanded:bg-accent",
        secondary:
          "bg-lavender text-night shadow-[inset_0_-3px_0_rgb(0_0_0/0.18)] hover:brightness-105",
        ghost:
          "text-muted-foreground hover:translate-y-0 hover:bg-sunken hover:text-foreground aria-expanded:bg-sunken aria-expanded:text-foreground",
        destructive:
          "bg-destructive-soft text-destructive hover:bg-destructive/20 focus-visible:ring-destructive/30",
        danger:
          "bg-destructive text-destructive-foreground shadow-[inset_0_-3px_0_rgb(0_0_0/0.18)] hover:brightness-105 focus-visible:ring-destructive/30",
        link: "text-muted-foreground underline underline-offset-4 decoration-border-strong hover:translate-y-0 hover:text-foreground hover:decoration-foreground",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        xs: "h-7 gap-1 rounded-[10px] px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-[12px] px-3 text-[13px] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 rounded-[18px] px-5 text-[16px] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs":
          "size-7 rounded-[10px] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-[12px] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
