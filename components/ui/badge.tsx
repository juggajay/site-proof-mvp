import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

/* Site-Proof Professional B2B Badge System - Exact Landing Page Implementation */
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        /* Primary - Site-Proof Blue */
        default: "border-transparent bg-[#1B4F72] text-white hover:bg-[#154360]",
        
        /* Secondary - Site-Proof Gold */
        secondary: "border-transparent bg-[#F1C40F] text-[#2C3E50] hover:bg-[#D4AC0D]",
        
        /* Success - Professional Green */
        success: "border-transparent bg-[#28A745] text-white hover:bg-[#218838]",
        
        /* Destructive - Professional Red */
        destructive: "border-transparent bg-[#DC3545] text-white hover:bg-[#C82333]",
        
        /* Warning - Professional Orange */
        warning: "border-transparent bg-[#FF6B35] text-white hover:bg-[#E55A2B]",
        
        /* Outline - Site-Proof Blue Border */
        outline: "border-[#1B4F72] text-[#1B4F72] bg-white hover:bg-[#F8F9FA]",
        
        /* Muted - Professional Grey */
        muted: "border-transparent bg-[#6C757D] text-white hover:bg-[#5A6268]",
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