import * as React from "react"

import { cn } from "../../lib/utils"

/* Site-Proof Professional B2B Textarea System - Exact Landing Page Implementation */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border-2 border-[#6C757D] bg-white px-3 py-2 text-sm font-primary text-[#2C3E50] ring-offset-white placeholder:text-[#6C757D] placeholder:italic focus-visible:outline-none focus-visible:border-[#1B4F72] focus-visible:ring-2 focus-visible:ring-[#1B4F72]/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }