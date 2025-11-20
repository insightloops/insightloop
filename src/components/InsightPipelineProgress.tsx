/**
 * Real-time Pipeline Progress Component
 * 
 * Displays the current stage, progress, and detailed status
 * of the feedback insight generation pipeline.
 */

import React from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Loader2,
  Upload,
  Brain,
  FileText,
  Lightbulb
} from 'lucide-react'

interface PipelineStage {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  status: 'pending' | 'running' | 'completed' | 'error'
  progress: number
  details?: string
  duration?: number
  startTime?: number
}

interface InsightPipelineProgressProps {
  stages: PipelineStage[]
  currentStage: string
  totalProgress: number
  isProcessing: boolean
}

const getStatusIcon = (status: PipelineStage['status'], isRunning: boolean = false) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-600" />
    case 'running':
      return <Loader2 className={`h-5 w-5 text-blue-600 ${isRunning ? 'animate-spin' : ''}`} />
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-600" />
    default:
      return <Clock className="h-5 w-5 text-gray-400" />
  }
}

const getStatusColor = (status: PipelineStage['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 border-green-200'
    case 'running':
      return 'bg-blue-100 border-blue-200'
    case 'error':
      return 'bg-red-100 border-red-200'
    default:
      return 'bg-gray-50 border-gray-200'
  }
}

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

export function InsightPipelineProgress({ 
  stages, 
  currentStage, 
  totalProgress, 
  isProcessing 
}: InsightPipelineProgressProps) {
  const completedStages = stages.filter(s => s.status === 'completed').length
  const currentStageData = stages.find(s => s.id === currentStage)

  return (
    <div className="space-y-6">
      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Overall Progress</h3>
          <Badge variant={isProcessing ? "default" : "secondary"}>
            {completedStages}/{stages.length} Stages Complete
          </Badge>
        </div>
        <Progress value={totalProgress} className="h-3" />
        <p className="text-sm text-gray-600">
          {Math.round(totalProgress)}% complete
          {isProcessing && currentStageData && (
            <span className="ml-2">• Currently: {currentStageData.name}</span>
          )}
        </p>
      </div>

      {/* Stage Details */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Pipeline Stages</h4>
        
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const Icon = stage.icon
            const isCurrentStage = stage.id === currentStage
            const isRunning = stage.status === 'running'
            
            return (
              <Card
                key={stage.id}
                className={`transition-all duration-300 ${getStatusColor(stage.status)} ${
                  isCurrentStage ? 'ring-2 ring-blue-500 shadow-md' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Stage Icon */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm">
                        <Icon className="h-5 w-5 text-gray-700" />
                      </div>
                      
                      {/* Stage Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-gray-900">{stage.name}</h5>
                          {getStatusIcon(stage.status, isRunning)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
                        
                        {/* Stage Details */}
                        {stage.details && (
                          <p className="text-xs text-gray-500 mt-1 italic">
                            {stage.details}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress and Duration */}
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {stage.progress}%
                        </span>
                        {stage.duration && (
                          <Badge variant="outline" className="text-xs">
                            {formatDuration(stage.duration)}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Individual Stage Progress */}
                      {stage.status === 'running' && (
                        <div className="w-24">
                          <Progress value={stage.progress} className="h-1" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Current Stage Detailed Info */}
      {isProcessing && currentStageData && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <div>
                <h5 className="font-medium text-blue-900">
                  Currently Processing: {currentStageData.name}
                </h5>
                <p className="text-sm text-blue-700 mt-1">
                  {currentStageData.details || currentStageData.description}
                </p>
                {currentStageData.startTime && (
                  <p className="text-xs text-blue-600 mt-1">
                    Running for {formatDuration(Date.now() - currentStageData.startTime)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Stats */}
      {isProcessing && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white p-3 rounded-lg border">
            <div className="text-lg font-semibold text-blue-600">{completedStages}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="bg-white p-3 rounded-lg border">
            <div className="text-lg font-semibold text-orange-600">
              {stages.filter(s => s.status === 'running').length}
            </div>
            <div className="text-xs text-gray-600">In Progress</div>
          </div>
          <div className="bg-white p-3 rounded-lg border">
            <div className="text-lg font-semibold text-gray-600">
              {stages.filter(s => s.status === 'pending').length}
            </div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-3 rounded-lg border">
            <div className="text-lg font-semibold text-green-600">
              {Math.round(totalProgress)}%
            </div>
            <div className="text-xs text-gray-600">Overall</div>
          </div>
        </div>
      )}
    </div>
  )
}
