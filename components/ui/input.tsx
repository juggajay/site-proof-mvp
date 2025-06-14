import * as React from "react"

import { cn } from "../../lib/utils"

/* Site-Proof Professional B2B Input System - Exact Landing Page Implementation */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border-2 border-[#6C757D] bg-white px-3 py-2 text-sm font-primary text-[#2C3E50] ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#6C757D] placeholder:italic focus-visible:outline-none focus-visible:border-[#1B4F72] focus-visible:ring-2 focus-visible:ring-[#1B4F72]/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }