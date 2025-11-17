/**
 * Reusable InsightCard Component - Usage Examples
 * 
 * This file demonstrates how to use the flexible InsightCard component
 * in different scenarios throughout the application.
 */

import { InsightCard, InsightCardData } from '@/components/ui/insight-card'

// Example 1: Dashboard variant (compact display)
export function DashboardInsightExample() {
  const dashboardInsight: InsightCardData = {
    id: '1',
    title: 'Mobile Authentication Issues',
    summary: 'Users experiencing frequent timeouts during login process, especially during peak hours.',
    theme: 'Authentication',
    status: 'active',
    created_at: '2024-01-15',
    insight_score: 0.85,
    urgency_score: 0.9,
    volume_score: 0.7,
    value_alignment_score: 0.8
  }

  return (
    <InsightCard
      insight={dashboardInsight}
      variant="dashboard"
      showActions={false}
      showMetrics={true}
      expandable={false}
      onClick={(insight) => console.log('Clicked insight:', insight.id)}
    />
  )
}

// Example 2: Compact variant (for lists and smaller spaces)
export function CompactInsightExample() {
  const compactInsight: InsightCardData = {
    id: '2',
    title: 'Dashboard Performance Optimization',
    summary: 'Dashboard loading times are impacting user experience across all segments.',
    theme: 'Performance',
    confidence: 0.75,
    painPoint: {
      severity: 'high',
      frequencyOfMention: 23
    }
  }

  return (
    <InsightCard
      insight={compactInsight}
      variant="compact"
      index={0}
      onClick={(insight) => console.log('Clicked insight:', insight.id)}
    />
  )
}

// Example 3: Detailed variant (full feature set)
export function DetailedInsightExample() {
  const detailedInsight: InsightCardData = {
    id: '3',
    title: 'Critical Payment Flow Issues',
    executiveSummary: 'Multiple users report payment failures during checkout, leading to abandoned purchases and revenue loss.',
    confidence: 0.92,
    painPoint: {
      severity: 'critical',
      description: 'Payment gateway timeouts and failed transactions are causing significant user frustration and business impact.',
      userJourneyStage: 'Checkout',
      frequencyOfMention: 45
    },
    impact: {
      usersAffected: 1250,
      userSegments: ['Enterprise', 'SMB'],
      businessImpact: {
        revenue: 'negative',
        churn: 'increase'
      }
    },
    recommendations: [
      {
        title: 'Implement Payment Retry Logic',
        description: 'Add automatic retry mechanism for failed payment attempts with exponential backoff.',
        priority: 'critical',
        effort: 'medium',
        timeline: '2 weeks'
      },
      {
        title: 'Payment Gateway Redundancy',
        description: 'Set up backup payment processors to handle failover scenarios.',
        priority: 'high',
        effort: 'high',
        timeline: '4 weeks'
      },
      {
        title: 'Enhanced Error Messaging',
        description: 'Provide clearer error messages and suggested actions for payment failures.',
        priority: 'medium',
        effort: 'low',
        timeline: '1 week'
      }
    ],
    stakeholderFormats: {
      executive: 'Payment failures are causing $50K monthly revenue loss. Immediate action required to implement retry logic and backup processors.',
      product: 'User journey analysis shows 23% drop-off at payment step. Recommend implementing retry mechanisms and improving error UX.',
      engineering: 'Payment gateway has 15% failure rate during peak hours. Need to implement retry logic, add monitoring, and set up failover.',
      customerSuccess: 'Customers frustrated with payment failures. Need better error messages and proactive support for failed transactions.'
    },
    evidence: {
      supportingFeedback: [
        { id: 'fb1', text: 'Payment failed again!' },
        { id: 'fb2', text: 'Cannot complete purchase' }
      ],
      sourceCluster: {
        size: 67,
        theme: 'Payment Issues'
      }
    },
    detailedAnalysis: 'Analysis of 500+ user feedback entries reveals a consistent pattern of payment gateway failures during peak traffic periods. The issue correlates with increased server load and third-party payment processor timeouts. Root cause analysis points to insufficient retry mechanisms and lack of redundancy in payment processing.'
  }

  return (
    <InsightCard
      insight={detailedInsight}
      variant="detailed"
      showActions={true}
      showMetrics={true}
      showStakeholders={true}
      expandable={true}
      index={0}
      onAction={(action, insight) => {
        console.log(`Action: ${action} on insight:`, insight.id)
      }}
    />
  )
}

// Example 4: Using with different data sources
export function MultiSourceInsightExample() {
  // From database insights
  const dbInsight: InsightCardData = {
    id: 'db-1',
    title: 'User Onboarding Optimization',
    summary: 'Analysis shows 40% drop-off rate during onboarding process.',
    theme: 'Onboarding',
    status: 'active',
    insight_score: 0.78,
    urgency_score: 0.65,
    volume_score: 0.82
  }

  // From generated insights (AI pipeline)
  const generatedInsight: InsightCardData = {
    id: 'gen-1',
    title: 'API Rate Limiting Issues',
    executiveSummary: 'Developers reporting frequent rate limit errors affecting application performance.',
    confidence: 0.88,
    painPoint: {
      severity: 'high',
      description: 'API rate limits too restrictive for common usage patterns',
      frequencyOfMention: 31
    },
    recommendations: [
      {
        title: 'Increase Rate Limits',
        description: 'Adjust rate limits based on usage analytics',
        priority: 'high',
        effort: 'low',
        timeline: '1 week'
      }
    ]
  }

  return (
    <div className="space-y-4">
      <h3>Database Insight</h3>
      <InsightCard
        insight={dbInsight}
        variant="dashboard"
        showMetrics={true}
      />
      
      <h3>Generated Insight</h3>
      <InsightCard
        insight={generatedInsight}
        variant="detailed"
        showActions={true}
        showMetrics={true}
        expandable={true}
      />
    </div>
  )
}

// Example 5: Grid layout with multiple insights
export function InsightGridExample() {
  const insights: InsightCardData[] = [
    {
      id: '1',
      title: 'Search Performance',
      summary: 'Search queries taking too long to return results',
      theme: 'Performance',
      insight_score: 0.72
    },
    {
      id: '2', 
      title: 'Mobile Responsiveness',
      summary: 'Mobile users report UI elements not displaying correctly',
      theme: 'Mobile',
      insight_score: 0.84
    },
    {
      id: '3',
      title: 'Data Export Features',
      summary: 'Users requesting more flexible data export options',
      theme: 'Features',
      insight_score: 0.67
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {insights.map((insight, index) => (
        <InsightCard
          key={insight.id}
          insight={insight}
          variant="dashboard"
          showActions={false}
          index={index}
          onClick={(insight) => console.log('Selected:', insight.title)}
        />
      ))}
    </div>
  )
}

// Example 6: Custom action handling
export function InsightWithActionsExample() {
  const insight: InsightCardData = {
    id: 'action-example',
    title: 'Integration API Reliability',
    summary: 'Third-party integrations experiencing intermittent failures',
    confidence: 0.79,
    recommendations: [
      {
        title: 'Add Health Checks',
        description: 'Implement monitoring for all integrations',
        priority: 'high',
        effort: 'medium',
        timeline: '2 weeks'
      }
    ]
  }

  const handleAction = (action: 'view' | 'export' | 'share', insight: InsightCardData) => {
    switch (action) {
      case 'view':
        // Navigate to detailed view
        console.log('Opening detailed view for:', insight.title)
        break
      case 'export':
        // Export insight data
        console.log('Exporting insight:', insight.title)
        break
      case 'share':
        // Share insight
        console.log('Sharing insight:', insight.title)
        break
    }
  }

  return (
    <InsightCard
      insight={insight}
      variant="detailed"
      showActions={true}
      showMetrics={true}
      expandable={true}
      onAction={handleAction}
    />
  )
}
