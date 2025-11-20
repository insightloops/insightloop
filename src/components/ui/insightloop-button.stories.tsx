import type { Meta, StoryObj } from '@storybook/react'
import { InsightLoopButton } from './insightloop-button'

const meta = {
  title: 'InsightLoop/InsightLoopButton',
  component: InsightLoopButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'InsightLoop branded button component with contextual variants, smart icons, and loading states. Designed specifically for AI and analytics interfaces.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    insightVariant: {
      control: 'select',
      options: ['primary', 'ai', 'analytics', 'insight', 'trend'],
      description: 'InsightLoop specific button variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'xl'],
      description: 'Button size',
    },
    withIcon: {
      control: 'boolean',
      description: 'Show contextual icon',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
    children: {
      control: 'text',
      description: 'Button content',
    },
  },
  args: {
    onClick: () => console.log('InsightLoop button clicked'),
  },
} satisfies Meta<typeof InsightLoopButton>

export default meta
type Story = StoryObj<typeof meta>

// InsightLoop Variants
export const Primary: Story = {
  args: {
    children: 'Generate Report',
    insightVariant: 'primary',
    withIcon: true,
  },
}

export const AI: Story = {
  args: {
    children: 'AI Analysis',
    insightVariant: 'ai',
    withIcon: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'AI variant with Brain icon and special pulsing animation.',
      },
    },
  },
}

export const Analytics: Story = {
  args: {
    children: 'View Analytics',
    insightVariant: 'analytics',
    withIcon: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Analytics variant with BarChart3 icon for data visualization features.',
      },
    },
  },
}

export const Insight: Story = {
  args: {
    children: 'Find Insights',
    insightVariant: 'insight',
    withIcon: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Insight variant with Sparkles icon for discovery features.',
      },
    },
  },
}

export const Trend: Story = {
  args: {
    children: 'Track Trends',
    insightVariant: 'trend',
    withIcon: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Trend variant with TrendingUp icon for trend analysis.',
      },
    },
  },
}

// Without Icons
export const WithoutIcon: Story = {
  args: {
    children: 'Simple Button',
    insightVariant: 'primary',
    withIcon: false,
  },
}

// Loading States
export const LoadingPrimary: Story = {
  args: {
    children: 'Generate Report',
    insightVariant: 'primary',
    withIcon: true,
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state with spinner and "Processing..." text.',
      },
    },
  },
}

export const LoadingAI: Story = {
  args: {
    children: 'AI Analysis',
    insightVariant: 'ai',
    withIcon: true,
    loading: true,
  },
}

// Sizes
export const Small: Story = {
  args: {
    children: 'Small Action',
    insightVariant: 'analytics',
    withIcon: true,
    size: 'sm',
  },
}

export const Large: Story = {
  args: {
    children: 'Large Action',
    insightVariant: 'ai',
    withIcon: true,
    size: 'lg',
  },
}

export const ExtraLarge: Story = {
  args: {
    children: 'Extra Large Action',
    insightVariant: 'primary',
    withIcon: true,
    size: 'xl',
  },
}

// States
export const Disabled: Story = {
  args: {
    children: 'Disabled Action',
    insightVariant: 'ai',
    withIcon: true,
    disabled: true,
  },
}

// Button Groups
export const InsightDashboard: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <InsightLoopButton insightVariant="primary" withIcon>
        Generate Report
      </InsightLoopButton>
      <InsightLoopButton insightVariant="analytics" withIcon>
        View Analytics
      </InsightLoopButton>
      <InsightLoopButton insightVariant="insight" withIcon>
        Find Insights
      </InsightLoopButton>
      <InsightLoopButton insightVariant="trend" withIcon>
        Track Trends
      </InsightLoopButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example dashboard with all InsightLoop button variants.',
      },
    },
  },
}

export const AIWorkflow: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-64">
      <InsightLoopButton insightVariant="ai" withIcon size="lg" className="w-full">
        Start AI Analysis
      </InsightLoopButton>
      <InsightLoopButton insightVariant="analytics" withIcon size="default" className="w-full">
        Review Results
      </InsightLoopButton>
      <InsightLoopButton insightVariant="insight" withIcon size="default" className="w-full">
        Generate Insights
      </InsightLoopButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example AI workflow with sequential actions.',
      },
    },
  },
}

// All Variants Showcase
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">With Icons</h4>
        <div className="space-y-2">
          <InsightLoopButton insightVariant="primary" withIcon>Primary</InsightLoopButton>
          <InsightLoopButton insightVariant="ai" withIcon>AI</InsightLoopButton>
          <InsightLoopButton insightVariant="analytics" withIcon>Analytics</InsightLoopButton>
          <InsightLoopButton insightVariant="insight" withIcon>Insight</InsightLoopButton>
          <InsightLoopButton insightVariant="trend" withIcon>Trend</InsightLoopButton>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Without Icons</h4>
        <div className="space-y-2">
          <InsightLoopButton insightVariant="primary">Primary</InsightLoopButton>
          <InsightLoopButton insightVariant="ai">AI</InsightLoopButton>
          <InsightLoopButton insightVariant="analytics">Analytics</InsightLoopButton>
          <InsightLoopButton insightVariant="insight">Insight</InsightLoopButton>
          <InsightLoopButton insightVariant="trend">Trend</InsightLoopButton>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Loading States</h4>
        <div className="space-y-2">
          <InsightLoopButton insightVariant="primary" withIcon loading>Primary</InsightLoopButton>
          <InsightLoopButton insightVariant="ai" withIcon loading>AI</InsightLoopButton>
          <InsightLoopButton insightVariant="analytics" withIcon loading>Analytics</InsightLoopButton>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete showcase of all InsightLoop button variants and states.',
      },
    },
  },
}
