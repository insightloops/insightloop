import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95',
  {
    variants: {
      variant: {
        // Primary InsightLoop Brand Button
        default: 'bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground hover:from-primary/90 hover:via-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl hover:shadow-primary/25 transform hover:scale-[1.02] backdrop-blur-sm border border-primary/20',
        
        // Secondary Professional Button
        secondary: 'bg-gradient-to-r from-secondary to-secondary/95 text-secondary-foreground hover:from-secondary-hover hover:to-secondary-hover/95 shadow-md hover:shadow-lg border border-border/50 backdrop-blur-sm',
        
        // Outline Glass Morphism Button
        outline: 'border-2 border-primary/30 bg-background/80 backdrop-blur-md hover:bg-primary/5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transform hover:scale-[1.01]',
        
        // Ghost Subtle Button
        ghost: 'hover:bg-accent/10 hover:text-accent-foreground backdrop-blur-sm hover:shadow-md transform hover:scale-[1.01]',
        
        // Link Style Button
        link: 'text-primary underline-offset-4 hover:underline hover:text-primary/80 transition-colors',
        
        // AI Special Effect Button
        ai: `bg-gradient-to-r from-insight-primary via-insight-tertiary to-insight-secondary text-primary-foreground 
             hover:shadow-2xl hover:shadow-insight-primary/25 hover:from-insight-primary/90 hover:via-insight-tertiary/90 hover:to-insight-secondary/90
             transform hover:scale-[1.03] border border-insight-primary/30 backdrop-blur-sm
             relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent 
             before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700`,
        
        // Status Buttons
        destructive: 'bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground hover:from-destructive/90 hover:to-destructive/80 shadow-lg hover:shadow-xl hover:shadow-destructive/25 transform hover:scale-[1.02] border border-destructive/20',
        
        success: 'bg-gradient-to-r from-success to-success/90 text-success-foreground hover:from-success/90 hover:to-success/80 shadow-lg hover:shadow-xl hover:shadow-success/25 transform hover:scale-[1.02] border border-success/20',
        
        warning: 'bg-gradient-to-r from-warning to-warning/90 text-warning-foreground hover:from-warning/90 hover:to-warning/80 shadow-lg hover:shadow-xl hover:shadow-warning/25 transform hover:scale-[1.02] border border-warning/20',
        
        info: 'bg-gradient-to-r from-info to-info/90 text-info-foreground hover:from-info/90 hover:to-info/80 shadow-lg hover:shadow-xl hover:shadow-info/25 transform hover:scale-[1.02] border border-info/20',
        
        // Glassmorphism Button
        glass: 'bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/10 text-foreground hover:bg-white/20 dark:hover:bg-black/20 hover:shadow-xl transform hover:scale-[1.02]',
      },
      size: {
        sm: 'h-9 rounded-lg px-4 text-xs',
        default: 'h-11 px-6 py-2',
        lg: 'h-13 rounded-xl px-8 text-base',
        xl: 'h-15 rounded-xl px-10 text-lg',
        icon: 'h-11 w-11',
        'icon-sm': 'h-9 w-9',
        'icon-lg': 'h-13 w-13',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
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
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
