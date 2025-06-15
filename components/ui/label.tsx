import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

/* Site-Proof Professional B2B Label System - Exact Landing Page Implementation */
const labelVariants = cva(
  "text-sm font-medium font-primary leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        /* Default - Site-Proof Charcoal */
        default: "text-[#2C3E50]",
        
        /* Primary - Site-Proof Blue */
        primary: "text-[#1B4F72]",
        
        /* Muted - Site-Proof Grey */
        muted: "text-[#6C757D]",
        
        /* Error - Professional Red */
        destructive: "text-[#DC3545]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, variant, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ variant }), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }