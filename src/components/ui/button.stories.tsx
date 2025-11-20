import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import { 
  Play, 
  Pause, 
  Download, 
  Upload, 
  Settings, 
  Heart, 
  Share2, 
  Copy, 
  Eye, 
  RefreshCw,
  Trash2,
  Edit,
  Plus
} from 'lucide-react'

const meta = {
  title: 'InsightLoop/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Enhanced button component with modern gradients, hover effects, and InsightLoop branding. Features glassmorphism, animations, and accessibility enhancements.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'secondary', 
        'outline',
        'ghost',
        'link',
        'ai',
        'success',
        'warning', 
        'info',
        'destructive',
        'glass'
      ],
      description: 'Button visual variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'xl', 'icon', 'icon-sm', 'icon-lg'],
      description: 'Button size',
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
    onClick: () => console.log('Button clicked'),
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// Basic Variants
export const Default: Story = {
  args: {
    children: 'Primary Button',
    variant: 'default',
  },
}

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
}

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
}

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
}

export const Link: Story = {
  args: {
    children: 'Link Button',
    variant: 'link',
  },
}

// AI & Special Effects
export const AI: Story = {
  args: {
    children: 'AI Analysis',
    variant: 'ai',
  },
  parameters: {
    docs: {
      description: {
        story: 'Special AI variant with shimmer effect on hover and pulsing animation.',
      },
    },
  },
}

export const Glass: Story = {
  args: {
    children: 'Glassmorphism',
    variant: 'glass',
  },
  parameters: {
    docs: {
      description: {
        story: 'Modern glassmorphism effect with backdrop blur.',
      },
    },
  },
}

// Status Variants
export const Success: Story = {
  args: {
    children: 'Success Action',
    variant: 'success',
  },
}

export const Warning: Story = {
  args: {
    children: 'Warning Action',
    variant: 'warning',
  },
}

export const Info: Story = {
  args: {
    children: 'Info Action',
    variant: 'info',
  },
}

export const Destructive: Story = {
  args: {
    children: 'Delete Action',
    variant: 'destructive',
  },
}

// Sizes
export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
}

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
  },
}

export const ExtraLarge: Story = {
  args: {
    children: 'Extra Large Button',
    size: 'xl',
  },
}

// Icon Buttons
export const IconButton: Story = {
  args: {
    size: 'icon',
    children: <Settings className="w-4 h-4" />,
  },
}

export const IconButtonSmall: Story = {
  args: {
    size: 'icon-sm',
    variant: 'outline',
    children: <Edit className="w-4 h-4" />,
  },
}

export const IconButtonLarge: Story = {
  args: {
    size: 'icon-lg',
    variant: 'ai',
    children: <Heart className="w-5 h-5" />,
  },
}

// With Icons
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Download className="w-4 h-4" />
        Download File
      </>
    ),
  },
}

export const WithIconSecondary: Story = {
  args: {
    variant: 'secondary',
    children: (
      <>
        <Upload className="w-4 h-4" />
        Upload File
      </>
    ),
  },
}

// States
export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
}

export const Loading: Story = {
  args: {
    children: (
      <>
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Processing...
      </>
    ),
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state with spinner animation.',
      },
    },
  },
}

// Button Groups
export const MediaControls: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button size="sm" variant="success">
        <Play className="w-4 h-4" />
        Play
      </Button>
      <Button size="sm" variant="warning">
        <Pause className="w-4 h-4" />
        Pause
      </Button>
      <Button size="sm" variant="outline">
        <RefreshCw className="w-4 h-4" />
        Reset
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of grouped buttons for media controls.',
      },
    },
  },
}

export const ActionGroup: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button size="sm" variant="ghost">
        <Eye className="w-4 h-4" />
        View
      </Button>
      <Button size="sm" variant="ghost">
        <Share2 className="w-4 h-4" />
        Share
      </Button>
      <Button size="sm" variant="ghost">
        <Copy className="w-4 h-4" />
        Copy
      </Button>
      <Button size="sm" variant="destructive">
        <Trash2 className="w-4 h-4" />
        Delete
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of action buttons grouped together.',
      },
    },
  },
}

// All Variants Showcase
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="ai">AI Special</Button>
      <Button variant="glass">Glass</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="info">Info</Button>
      <Button variant="destructive">Destructive</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Showcase of all available button variants.',
      },
    },
  },
}
