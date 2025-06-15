import * as React from "react"

import { cn } from "../../lib/utils"

/* Site-Proof Professional B2B Progress System - Exact Landing Page Implementation */
export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-[#E9ECEF]",
        className
      )}
      {...props}
    >
      <div
        className="h-full bg-[#1B4F72] transition-all duration-300 ease-in-out"
        style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }}
      />
    </div>
  )
)
Progress.displayName = "Progress"

export { Progress }