/**
 * Example: How to use PipelineResultsFromEvents
 * 
 * This shows how to use the PipelineResultsFromEvents component 
 * which takes raw SSE events and automatically renders the results UI.
 */

import { PipelineResultsFromEvents } from './PipelineResultsFromEvents'

// Example usage
export function ExamplePipelineResults() {
  // Example events array (would come from SSE stream)
  const sampleEvents = [
    {
      type: 'enriched_feedback_created',
      pipelineId: 'pipeline_123',
      timestamp: '2025-11-15T10:00:00Z',
      feedbackId: 'feedback_1',
      originalText: 'The mobile app crashes when I upload photos',
      productArea: 'Mobile App',
      sentiment: 'negative',
      urgency: 'high',
      customerSegment: 'Individual',
      llmPrompt: 'Analyze this feedback...',
      llmResponse: '{"sentiment": "negative", "urgency": "high"...}'
    },
    {
      type: 'cluster_created',
      pipelineId: 'pipeline_123',
      timestamp: '2025-11-15T10:01:00Z',
      clusterId: 'cluster_1',
      theme: 'Mobile App Issues',
      description: 'Problems with the mobile application',
      size: 3,
      dominantSentiment: 'negative',
      avgConfidence: 0.8,
      productAreas: ['Mobile App'],
      feedbackIds: ['feedback_1', 'feedback_2', 'feedback_3']
    },
    {
      type: 'insight_created',
      pipelineId: 'pipeline_123',
      timestamp: '2025-11-15T10:02:00Z',
      insightId: 'insight_1',
      clusterId: 'cluster_1',
      title: 'Critical Mobile App Stability Issues',
      summary: 'Multiple users report crashes during photo uploads',
      severity: 'critical',
      confidence: 0.9
    }
  ]

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Pipeline Results from Events</h1>
      <PipelineResultsFromEvents events={sampleEvents} />
    </div>
  )
}

// Usage in any component:
// 
// function MyComponent() {
//   const [events, setEvents] = useState([])
//   
//   // Collect events from SSE stream
//   useEffect(() => {
//     const eventSource = new EventSource('/api/pipeline/stream')
//     eventSource.onmessage = (event) => {
//       const eventData = JSON.parse(event.data)
//       setEvents(prev => [...prev, eventData])
//     }
//   }, [])
//   
//   return <PipelineResultsFromEvents events={events} />
// }
