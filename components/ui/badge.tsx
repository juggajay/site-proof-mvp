import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium font-heading transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-600 text-white hover:bg-primary-700",
        secondary:
          "border-transparent bg-secondary-500 text-white hover:bg-secondary-600",
        destructive:
          "border-transparent bg-error-500 text-white hover:bg-error-600",
        success:
          "bg-success-100 text-success-800 border border-success-200 hover:bg-success-200",
        warning:
          "bg-warning-100 text-warning-800 border border-warning-200 hover:bg-warning-200",
        error:
          "bg-error-100 text-error-800 border border-error-200 hover:bg-error-200",
        outline: "text-neutral-700 border-neutral-300 hover:bg-neutral-50",
        completed: "bg-success-100 text-success-800 border border-success-200",
        pending: "bg-warning-100 text-warning-800 border border-warning-200",
        failed: "bg-error-100 text-error-800 border border-error-200",
        active: "bg-primary-100 text-primary-800 border border-primary-200",
        inactive: "bg-neutral-100 text-neutral-600 border border-neutral-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }