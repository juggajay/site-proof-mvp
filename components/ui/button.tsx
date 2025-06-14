import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium font-heading ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
        destructive:
          "bg-error-500 text-white hover:bg-error-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
        outline:
          "border-2 border-primary-600 bg-white text-primary-600 hover:bg-primary-50 shadow-md hover:shadow-lg",
        secondary:
          "bg-secondary-500 text-white hover:bg-secondary-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
        ghost: "hover:bg-neutral-100 hover:text-neutral-900 transition-colors duration-200",
        link: "text-primary-600 underline-offset-4 hover:underline hover:text-primary-700",
        success: "bg-success-500 text-white hover:bg-success-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
        warning: "bg-warning-500 text-white hover:bg-warning-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-lg px-4 py-2 text-xs",
        lg: "h-12 rounded-lg px-8 py-4 text-base",
        xl: "h-14 rounded-lg px-10 py-5 text-lg",
        icon: "h-11 w-11",
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