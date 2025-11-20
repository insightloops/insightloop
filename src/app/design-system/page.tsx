'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { InsightLoopButton } from '@/components/ui/insightloop-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, 
  Brain, 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Download, 
  Upload, 
  Settings, 
  Play,
  Pause,
  Heart,
  Share2,
  Copy,
  Eye,
  RefreshCw
} from 'lucide-react'

export default function ThemeShowcase() {
  const [loading, setLoading] = useState(false)

  const handleLoadingDemo = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 3000)
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-6">
            <h1 className="text-5xl font-bold vortex-gradient-text">
              InsightLoop Vortex Design System
            </h1>
            <ThemeToggle />
          </div>
          <p className="text-muted-foreground text-xl max-w-3xl mx-auto">
            Professional, clean interface components for modern AI-powered product intelligence. 
            Built with precision, accessibility, and performance in mind.
          </p>
          <div className="border border-primary/20 rounded-xl p-4 max-w-lg mx-auto bg-primary/5">
            <p className="text-primary font-semibold flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" />
              <span className="vortex-accent">Vortex</span> Design System
            </p>
          </div>
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
                <div 
                  className="w-full h-20 rounded-lg border border-border shadow-sm"
                  style={{background: 'hsl(199 89% 48%)'}}
                ></div>
                <div className="text-center">
                  <p className="font-medium">Primary</p>
                  <p className="text-xs text-muted-foreground">Electric Cerulean</p>
                  <p className="text-xs text-muted-foreground font-mono">#1a8cdf</p>
                </div>
              </div>
              <div className="space-y-2">
                <div 
                  className="w-full h-20 rounded-lg border border-border shadow-sm"
                  style={{background: 'hsl(258 90% 66%)'}}
                ></div>
                <div className="text-center">
                  <p className="font-medium">Secondary</p>
                  <p className="text-xs text-muted-foreground">Electric Violet</p>
                  <p className="text-xs text-muted-foreground font-mono">#8b5cf6</p>
                </div>
              </div>
              <div className="space-y-2">
                <div 
                  className="w-full h-20 rounded-lg border border-border shadow-sm"
                  style={{background: 'hsl(142 76% 36%)'}}
                ></div>
                <div className="text-center">
                  <p className="font-medium">Accent</p>
                  <p className="text-xs text-muted-foreground">Neon Emerald</p>
                  <p className="text-xs text-muted-foreground font-mono">#059669</p>
                </div>
              </div>
              <div className="space-y-2">
                <div 
                  className="w-full h-20 rounded-lg border border-border shadow-sm"
                  style={{background: 'hsl(38 92% 50%)'}}
                ></div>
                <div className="text-center">
                  <p className="font-medium">Warning</p>
                  <p className="text-xs text-muted-foreground">Amber Alert</p>
                  <p className="text-xs text-muted-foreground font-mono">#f59e0b</p>
                </div>
              </div>
              <div className="space-y-2">
                <div 
                  className="w-full h-20 rounded-lg border border-border shadow-sm"
                  style={{background: 'hsl(199 89% 48%)'}}
                ></div>
                <div className="text-center">
                  <p className="font-medium">Info</p>
                  <p className="text-xs text-muted-foreground">Info Blue</p>
                  <p className="text-xs text-muted-foreground font-mono">#1a8cdf</p>
                </div>
              </div>
              <div className="space-y-2">
                <div 
                  className="w-full h-20 rounded-lg border border-border shadow-sm"
                  style={{background: 'hsl(0 84% 60%)'}}
                ></div>
                <div className="text-center">
                  <p className="font-medium">Error</p>
                  <p className="text-xs text-muted-foreground">Bright Red</p>
                  <p className="text-xs text-muted-foreground font-mono">#ef4444</p>
                </div>
              </div>
            </div>
            
            {/* Dark Mode Colors */}
            <div className="mt-8">
              <h4 className="font-semibold mb-4">Dark Mode Palette</h4>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <div 
                    className="w-full h-20 rounded-lg border border-gray-700 shadow-sm"
                    style={{background: 'hsl(199 89% 68%)'}}
                  ></div>
                  <div className="text-center">
                    <p className="font-medium">Primary Dark</p>
                    <p className="text-xs text-muted-foreground">Bright Cerulean</p>
                    <p className="text-xs text-muted-foreground font-mono">#3b9eff</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div 
                    className="w-full h-20 rounded-lg border border-gray-700 shadow-sm"
                    style={{background: 'hsl(258 90% 76%)'}}
                  ></div>
                  <div className="text-center">
                    <p className="font-medium">Secondary Dark</p>
                    <p className="text-xs text-muted-foreground">Bright Violet</p>
                    <p className="text-xs text-muted-foreground font-mono">#a855f7</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div 
                    className="w-full h-20 rounded-lg border border-gray-700 shadow-sm"
                    style={{background: 'hsl(142 76% 56%)'}}
                  ></div>
                  <div className="text-center">
                    <p className="font-medium">Accent Dark</p>
                    <p className="text-xs text-muted-foreground">Bright Emerald</p>
                    <p className="text-xs text-muted-foreground font-mono">#10b981</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div 
                    className="w-full h-20 rounded-lg border border-gray-700 shadow-sm"
                    style={{background: 'hsl(38 92% 70%)'}}
                  ></div>
                  <div className="text-center">
                    <p className="font-medium">Warning Dark</p>
                    <p className="text-xs text-muted-foreground">Bright Amber</p>
                    <p className="text-xs text-muted-foreground font-mono">#fbbf24</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div 
                    className="w-full h-20 rounded-lg border border-gray-700 shadow-sm"
                    style={{background: 'hsl(199 89% 68%)'}}
                  ></div>
                  <div className="text-center">
                    <p className="font-medium">Info Dark</p>
                    <p className="text-xs text-muted-foreground">Bright Cerulean</p>
                    <p className="text-xs text-muted-foreground font-mono">#3b9eff</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div 
                    className="w-full h-20 rounded-lg border border-gray-700 shadow-sm"
                    style={{background: 'hsl(0 92% 72%)'}}
                  ></div>
                  <div className="text-center">
                    <p className="font-medium">Error Dark</p>
                    <p className="text-xs text-muted-foreground">Neon Red</p>
                    <p className="text-xs text-muted-foreground font-mono">#f87171</p>
                  </div>
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                <Button variant="glass">Glass</Button>
                <Badge variant="secondary">Glassmorphism</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI-Enhanced Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>AI-Enhanced Buttons</CardTitle>
            <CardDescription>
              Special effects and animations for AI and analytics features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Button variant="ai" size="lg">
                  <Brain className="w-5 h-5" />
                  AI Analysis
                </Button>
                <p className="text-sm text-muted-foreground">Shimmer effect on hover</p>
              </div>
              <div className="space-y-3">
                <InsightLoopButton insightVariant="ai" withIcon size="lg">
                  Generate Insights
                </InsightLoopButton>
                <p className="text-sm text-muted-foreground">Pulsing animation</p>
              </div>
              <div className="space-y-3">
                <InsightLoopButton 
                  insightVariant="ai" 
                  withIcon 
                  size="lg"
                  loading={loading}
                  onClick={handleLoadingDemo}
                >
                  Process Data
                </InsightLoopButton>
                <p className="text-sm text-muted-foreground">Loading state demo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status & Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Action Buttons</CardTitle>
            <CardDescription>
              Contextual buttons for different actions and states
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-3">
                <Button variant="success" size="default">
                  <TrendingUp className="w-4 h-4" />
                  Success
                </Button>
              </div>
              <div className="space-y-3">
                <Button variant="warning" size="default">
                  <Sparkles className="w-4 h-4" />
                  Warning
                </Button>
              </div>
              <div className="space-y-3">
                <Button variant="info" size="default">
                  <BarChart3 className="w-4 h-4" />
                  Info
                </Button>
              </div>
              <div className="space-y-3">
                <Button variant="destructive" size="default">
                  <Zap className="w-4 h-4" />
                  Error
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* InsightLoop Themed Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>InsightLoop Themed Buttons</CardTitle>
            <CardDescription>
              Brand-specific buttons with contextual icons and styling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-3">
                <InsightLoopButton insightVariant="primary" withIcon>
                  Generate Report
                </InsightLoopButton>
                <p className="text-sm text-muted-foreground">Primary action</p>
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

        {/* Button Sizes */}
        <Card>
          <CardHeader>
            <CardTitle>Button Sizes</CardTitle>
            <CardDescription>
              Different sizes for various use cases and layouts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm" variant="outline">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra Large</Button>
              <Button size="icon-sm" variant="outline">
                <Settings className="w-4 h-4" />
              </Button>
              <Button size="icon">
                <Play className="w-4 h-4" />
              </Button>
              <Button size="icon-lg">
                <Heart className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Button Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Interactive Button Examples</CardTitle>
            <CardDescription>
              Common button combinations used throughout InsightLoop
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Action Group 1 */}
              <div className="space-y-3">
                <h4 className="font-medium">File Operations</h4>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>

              {/* Action Group 2 */}
              <div className="space-y-3">
                <h4 className="font-medium">Media Controls</h4>
                <div className="flex gap-2">
                  <Button size="sm" variant="success">
                    <Play className="w-4 h-4" />
                    Start
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
              </div>

              {/* Action Group 3 */}
              <div className="space-y-3">
                <h4 className="font-medium">Social Actions</h4>
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
              Best practices for using InsightLoop buttons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-success">✅ Do</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Use primary buttons for main actions</li>
                  <li>• Use AI variant for machine learning features</li>
                  <li>• Combine icons with text for clarity</li>
                  <li>• Use loading states for async operations</li>
                  <li>• Maintain consistent sizing within groups</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-destructive">❌ Don't</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Use too many primary buttons per page</li>
                  <li>• Mix button styles inconsistently</li>
                  <li>• Overuse animated variants</li>
                  <li>• Use destructive variant for non-critical actions</li>
                  <li>• Create buttons without proper contrast</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
