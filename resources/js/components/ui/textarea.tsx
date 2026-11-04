import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full px-3.5 py-2.5 text-base font-medium rounded-[14px] border-[1.5px] border-input bg-sunken transition-[border-color,box-shadow] outline-none hover:border-border-strong focus-visible:border-lavender focus-visible:ring-3 focus-visible:ring-lavender/20 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 placeholder:text-muted-foreground/75 disabled:cursor-not-allowed disabled:opacity-50 md:text-[15px]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
