import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Default — solid primary, sedikit lebih soft dari sebelumnya
        default:
          "bg-primary/90 text-primary-foreground shadow-sm hover:bg-primary hover:shadow-md",
        // Destructive — merah lebih soft
        destructive:
          "bg-destructive/85 text-destructive-foreground shadow-sm hover:bg-destructive/95 hover:shadow-md",
        // Outline — border tipis, hover subtle
        outline:
          "border border-input bg-background/80 shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-primary/30",
        // Secondary — muted background, tidak mencolok
        secondary:
          "bg-secondary/80 text-secondary-foreground shadow-sm hover:bg-secondary",
        // Ghost — transparan, hover sangat subtle
        ghost:
          "hover:bg-accent/60 hover:text-accent-foreground",
        // Link — text only
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8",
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
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
