import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95 relative overflow-hidden group cursor-pointer',
  {
    variants: {
      variant: {
        // Primary Vortex Button - Electric Cerulean
        default: `bg-[hsl(199_89%_48%)] text-white 
                 hover:bg-[hsl(199_89%_42%)] 
                 shadow-lg hover:shadow-xl hover:shadow-[hsl(199_89%_48%)]/25 
                 border border-[hsl(199_89%_48%)]/20 backdrop-blur-sm
                 transform hover:scale-[1.02] transition-all duration-200
                 font-semibold text-sm
                 dark:bg-[hsl(199_89%_68%)] dark:hover:bg-[hsl(199_89%_72%)]
                 dark:text-[hsl(222_84%_4.9%)] dark:shadow-[hsl(199_89%_68%)]/25
                 before:absolute before:inset-0 before:bg-gradient-to-r 
                 before:from-transparent before:via-white/10 before:to-transparent 
                 before:translate-x-[-100%] hover:before:translate-x-[100%] 
                 before:transition-transform before:duration-500`,
        
        // Secondary Vortex Button - Electric Violet
        secondary: `bg-[hsl(258_90%_66%)] text-white 
                   hover:bg-[hsl(258_90%_60%)] 
                   shadow-md hover:shadow-lg hover:shadow-[hsl(258_90%_66%)]/20
                   border border-[hsl(258_90%_66%)]/20 backdrop-blur-sm 
                   transform hover:scale-[1.02] transition-all duration-200
                   font-semibold text-sm
                   dark:bg-[hsl(258_90%_76%)] dark:hover:bg-[hsl(258_90%_80%)]
                   dark:text-[hsl(222_84%_4.9%)] dark:shadow-[hsl(258_90%_76%)]/20`,
        
        // Outline Vortex Button - Clean Outline
        outline: `border-2 border-[hsl(199_89%_48%)] bg-transparent text-[hsl(199_89%_48%)]
                 hover:bg-[hsl(199_89%_48%)] hover:text-white 
                 shadow-sm hover:shadow-md 
                 transform hover:scale-[1.02] transition-all duration-200
                 font-semibold text-sm
                 dark:border-[hsl(199_89%_68%)] dark:text-[hsl(199_89%_68%)]
                 dark:hover:bg-[hsl(199_89%_68%)] dark:hover:text-[hsl(222_84%_4.9%)]`,
        
        // Ghost Vortex Button - Subtle Hover
        ghost: `hover:bg-accent/10 hover:text-accent-foreground 
               transition-all duration-200 font-semibold text-sm`,
        
        // Link Style Button
        link: 'text-primary underline-offset-4 hover:underline hover:text-primary/80 transition-colors',
        
        // AI Enhanced Button - Subtle Premium Feel
        ai: `bg-gradient-to-r from-[hsl(199_89%_48%)] to-[hsl(199_89%_52%)] text-white
             hover:from-[hsl(199_89%_45%)] hover:to-[hsl(199_89%_49%)]
             shadow-lg hover:shadow-xl hover:shadow-[hsl(199_89%_48%)]/20 
             border border-[hsl(199_89%_48%)]/30 backdrop-blur-sm
             transform hover:scale-[1.02] transition-all duration-250
             font-semibold text-sm
             dark:from-[hsl(199_89%_68%)] dark:to-[hsl(199_89%_72%)]
             dark:hover:from-[hsl(199_89%_65%)] dark:hover:to-[hsl(199_89%_69%)]
             dark:text-[hsl(222_84%_4.9%)] dark:shadow-[hsl(199_89%_68%)]/20
             relative overflow-hidden
             before:absolute before:inset-0 before:bg-gradient-to-r 
             before:from-transparent before:via-white/8 before:to-transparent 
             before:translate-x-[-200%] hover:before:translate-x-[200%] 
             before:transition-transform before:duration-800 before:ease-out`,
        
        // Status Buttons - Clean Vortex Style
        destructive: `bg-[hsl(0_84%_60%)] text-white hover:bg-[hsl(0_84%_55%)] 
                     shadow-md hover:shadow-lg transform hover:scale-[1.02] 
                     transition-all duration-200 font-semibold text-sm
                     dark:bg-[hsl(0_92%_72%)] dark:hover:bg-[hsl(0_92%_68%)] dark:text-[hsl(222_84%_4.9%)]`,
        
        success: `bg-[hsl(142_76%_36%)] text-white hover:bg-[hsl(142_76%_32%)] 
                 shadow-md hover:shadow-lg transform hover:scale-[1.02] 
                 transition-all duration-200 font-semibold text-sm
                 dark:bg-[hsl(142_76%_56%)] dark:hover:bg-[hsl(142_76%_52%)] dark:text-[hsl(222_84%_4.9%)]`,
        
        warning: `bg-[hsl(38_92%_50%)] text-white hover:bg-[hsl(38_92%_45%)] 
                 shadow-md hover:shadow-lg transform hover:scale-[1.02] 
                 transition-all duration-200 font-semibold text-sm
                 dark:bg-[hsl(38_92%_70%)] dark:hover:bg-[hsl(38_92%_65%)] dark:text-[hsl(222_84%_4.9%)]`,
        
        info: `bg-[hsl(199_89%_48%)] text-white hover:bg-[hsl(199_89%_42%)] 
              shadow-md hover:shadow-lg transform hover:scale-[1.02] 
              transition-all duration-200 font-semibold text-sm
              dark:bg-[hsl(199_89%_68%)] dark:hover:bg-[hsl(199_89%_64%)] dark:text-[hsl(222_84%_4.9%)]`,
        
        // Glass Vortex Button - Clean Glass Effect
        glass: `bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 
               text-foreground hover:bg-white/20 dark:hover:bg-white/10 
               shadow-md hover:shadow-lg transform hover:scale-[1.02] 
               transition-all duration-200 font-semibold text-sm`,
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
