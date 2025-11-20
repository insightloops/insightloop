import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../components/ui/button'
import { InsightLoopButton } from '../components/ui/insightloop-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

const meta = {
  title: 'InsightLoop/Design System',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Complete InsightLoop design system showcase featuring the enhanced color palette, button components, and modern UI patterns optimized for AI and analytics interfaces.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const CompleteDesignSystem: Story = {
  render: () => (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            InsightLoop Design System
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Beautiful, modern components designed for AI-powered analytics platforms. 
            Optimized for both light and dark themes with glassmorphism and gradient effects.
          </p>
        </div>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>
              InsightLoop brand colors optimized for data visualization and AI interfaces
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="space-y-2">
                <div className="w-full h-20 rounded-lg bg-gradient-to-br from-primary to-primary/80 border border-border"></div>
                <div className="text-center">
                  <p className="font-medium">Primary</p>
                  <p className="text-xs text-muted-foreground">AI Blue</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-20 rounded-lg bg-gradient-to-br from-accent to-accent/80 border border-border"></div>
                <div className="text-center">
                  <p className="font-medium">Accent</p>
                  <p className="text-xs text-muted-foreground">Analytics Teal</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-20 rounded-lg bg-gradient-to-br from-success to-success/80 border border-border"></div>
                <div className="text-center">
                  <p className="font-medium">Success</p>
                  <p className="text-xs text-muted-foreground">Insight Green</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-20 rounded-lg bg-gradient-to-br from-warning to-warning/80 border border-border"></div>
                <div className="text-center">
                  <p className="font-medium">Warning</p>
                  <p className="text-xs text-muted-foreground">Alert Orange</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-20 rounded-lg bg-gradient-to-br from-info to-info/80 border border-border"></div>
                <div className="text-center">
                  <p className="font-medium">Info</p>
                  <p className="text-xs text-muted-foreground">Data Blue</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-20 rounded-lg bg-gradient-to-br from-destructive to-destructive/80 border border-border"></div>
                <div className="text-center">
                  <p className="font-medium">Error</p>
                  <p className="text-xs text-muted-foreground">Alert Red</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Standard Button Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Standard Button Variants</CardTitle>
            <CardDescription>
              Core button styles with modern gradients and hover effects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="space-y-3">
                <Button variant="default">Primary</Button>
                <Badge variant="secondary">Default</Badge>
              </div>
              <div className="space-y-3">
                <Button variant="secondary">Secondary</Button>
                <Badge variant="secondary">Secondary</Badge>
              </div>
              <div className="space-y-3">
                <Button variant="outline">Outline</Button>
                <Badge variant="secondary">Outline</Badge>
              </div>
              <div className="space-y-3">
                <Button variant="ghost">Ghost</Button>
                <Badge variant="secondary">Ghost</Badge>
              </div>
              <div className="space-y-3">
                <Button variant="ai">AI Special</Button>
                <Badge variant="secondary">AI Effects</Badge>
              </div>
              <div className="space-y-3">
                <Button variant="glass">Glass</Button>
                <Badge variant="secondary">Glassmorphism</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* InsightLoop Branded Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>InsightLoop Branded Buttons</CardTitle>
            <CardDescription>
              Brand-specific buttons with contextual icons and styling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-3">
                <InsightLoopButton insightVariant="primary" withIcon>
                  Generate Report
                </InsightLoopButton>
                <p className="text-sm text-muted-foreground">Primary action</p>
              </div>
              <div className="space-y-3">
                <InsightLoopButton insightVariant="ai" withIcon>
                  AI Analysis
                </InsightLoopButton>
                <p className="text-sm text-muted-foreground">AI features</p>
              </div>
              <div className="space-y-3">
                <InsightLoopButton insightVariant="analytics" withIcon>
                  View Analytics
                </InsightLoopButton>
                <p className="text-sm text-muted-foreground">Data visualization</p>
              </div>
              <div className="space-y-3">
                <InsightLoopButton insightVariant="insight" withIcon>
                  Find Insights
                </InsightLoopButton>
                <p className="text-sm text-muted-foreground">Discovery action</p>
              </div>
              <div className="space-y-3">
                <InsightLoopButton insightVariant="trend" withIcon>
                  Track Trends
                </InsightLoopButton>
                <p className="text-sm text-muted-foreground">Trend analysis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Feedback Buttons</CardTitle>
            <CardDescription>
              Contextual buttons for different states and user feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="success">Success State</Button>
              <Button variant="warning">Warning State</Button>
              <Button variant="info">Info State</Button>
              <Button variant="destructive">Error State</Button>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Interactive Examples</CardTitle>
            <CardDescription>
              Real-world button combinations and workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              
              {/* AI Workflow */}
              <div className="space-y-3">
                <h4 className="font-medium">AI Analysis Workflow</h4>
                <div className="flex flex-wrap gap-2">
                  <InsightLoopButton insightVariant="ai" withIcon size="lg">
                    Start AI Analysis
                  </InsightLoopButton>
                  <InsightLoopButton insightVariant="analytics" withIcon>
                    Review Results
                  </InsightLoopButton>
                  <InsightLoopButton insightVariant="insight" withIcon>
                    Generate Insights
                  </InsightLoopButton>
                </div>
              </div>

              {/* Dashboard Actions */}
              <div className="space-y-3">
                <h4 className="font-medium">Dashboard Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="default">Export Report</Button>
                  <Button variant="outline">Share Dashboard</Button>
                  <Button variant="ghost">View Details</Button>
                  <Button variant="secondary">Settings</Button>
                </div>
              </div>

              {/* Loading States */}
              <div className="space-y-3">
                <h4 className="font-medium">Loading States</h4>
                <div className="flex flex-wrap gap-2">
                  <InsightLoopButton insightVariant="ai" withIcon loading>
                    Processing Data
                  </InsightLoopButton>
                  <InsightLoopButton insightVariant="analytics" withIcon loading>
                    Generating Charts
                  </InsightLoopButton>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Guidelines</CardTitle>
            <CardDescription>
              Best practices for using InsightLoop design system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-success">✅ Best Practices</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Use InsightLoop variants for branded features</li>
                  <li>• Use AI variant for machine learning operations</li>
                  <li>• Combine icons with text for better UX</li>
                  <li>• Show loading states for async operations</li>
                  <li>• Maintain consistent sizing within groups</li>
                  <li>• Use appropriate status colors</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-destructive">❌ Avoid</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Too many primary buttons per view</li>
                  <li>• Mixing inconsistent button styles</li>
                  <li>• Overusing animated effects</li>
                  <li>• Destructive buttons for non-critical actions</li>
                  <li>• Poor color contrast ratios</li>
                  <li>• Buttons without clear purpose</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete showcase of the InsightLoop design system including colors, typography, buttons, and usage guidelines.',
      },
    },
  },
}
