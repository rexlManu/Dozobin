import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 px-3.5 py-1 text-base font-medium rounded-[14px] border-[1.5px] border-input bg-sunken transition-[border-color,box-shadow] outline-none hover:border-border-strong focus-visible:border-lavender focus-visible:ring-3 focus-visible:ring-lavender/20 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:font-medium placeholder:text-muted-foreground/75 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-[15px]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
