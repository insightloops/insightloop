import * as React from 'react'
import { Button, ButtonProps } from './button'
import { cn } from '@/lib/utils'
import { Sparkles, Zap, TrendingUp, Brain, BarChart3 } from 'lucide-react'

// InsightLoop specific button variants
interface InsightLoopButtonProps extends ButtonProps {
  insightVariant?: 'primary' | 'ai' | 'analytics' | 'insight' | 'trend'
  withIcon?: boolean
  loading?: boolean
}

const InsightLoopButton = React.forwardRef<HTMLButtonElement, InsightLoopButtonProps>(
  ({ className, insightVariant = 'primary', withIcon = false, loading = false, children, ...props }, ref) => {
    
    const getIcon = () => {
      if (!withIcon) return null
      
      switch (insightVariant) {
        case 'ai':
          return <Brain className="w-4 h-4" />
        case 'analytics':
          return <BarChart3 className="w-4 h-4" />
        case 'insight':
          return <Sparkles className="w-4 h-4" />
        case 'trend':
          return <TrendingUp className="w-4 h-4" />
        default:
          return <Zap className="w-4 h-4" />
      }
    }

    const getVariant = (): ButtonProps['variant'] => {
      switch (insightVariant) {
        case 'ai':
          return 'ai'
        case 'analytics':
          return 'info'
        case 'insight':
          return 'success'
        case 'trend':
          return 'warning'
        default:
          return 'default'
      }
    }

    return (
      <Button
        ref={ref}
        variant={getVariant()}
        className={cn(
          'insightloop-focus transition-all duration-300',
          insightVariant === 'ai' && 'insightloop-button-ai',
          className
        )}
        disabled={loading}
        {...props}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Processing...
          </>
        ) : (
          <>
            {getIcon()}
            {children}
          </>
        )}
      </Button>
    )
  }
)

InsightLoopButton.displayName = 'InsightLoopButton'

export { InsightLoopButton, type InsightLoopButtonProps }
