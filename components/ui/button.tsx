import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

/* Site-Proof Professional B2B Button System - Exact Landing Page Implementation */
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium font-primary transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4F72] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        /* Primary - Site-Proof Blue (#1B4F72) - Matches landing page primary buttons */
        default: "bg-[#1B4F72] text-white hover:bg-[#154360] shadow-md hover:shadow-lg hover:-translate-y-0.5",
        
        /* Secondary - Site-Proof Gold (#F1C40F) - Matches landing page secondary buttons */
        secondary: "bg-[#F1C40F] text-[#2C3E50] hover:bg-[#D4AC0D] shadow-md hover:shadow-lg hover:-translate-y-0.5",
        
        /* Tertiary - Outline Blue - Matches landing page tertiary buttons */
        outline: "border-2 border-[#1B4F72] bg-transparent text-[#1B4F72] hover:bg-[#1B4F72] hover:text-white",
        
        /* Ghost - Subtle hover for navigation */
        ghost: "text-[#2C3E50] hover:bg-[#F8F9FA] hover:text-[#1B4F72]",
        
        /* Destructive - Professional error state */
        destructive: "bg-[#DC3545] text-white hover:bg-[#C82333] shadow-md",
        
        /* Link - Text-only button */
        link: "text-[#1B4F72] underline-offset-4 hover:underline font-medium",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }