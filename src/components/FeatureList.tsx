'use client'

import { useState } from 'react'
import { Feature, FeatureStatus, FeaturePriority } from '@/types/database'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card } from './ui/card'
import { Select } from './ui/select'
import { CheckSquare, Square } from 'lucide-react'

interface FeatureListProps {
  features: Feature[]
  onEditFeature?: (feature: Feature) => void
  onDeleteFeature?: (featureId: string) => void
  onUpdateStatus?: (featureId: string, status: FeatureStatus) => void
  onUpdatePriority?: (featureId: string, priority: FeaturePriority) => void
  showProductArea?: boolean
  groupByStatus?: boolean
  selectedFeatures?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  showSelection?: boolean
}

const statusColors = {
  [FeatureStatus.PLANNED]: 'bg-blue-100 text-blue-800',
  [FeatureStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
  [FeatureStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [FeatureStatus.ON_HOLD]: 'bg-gray-100 text-gray-800',
  [FeatureStatus.CANCELLED]: 'bg-red-100 text-red-800'
}

const priorityColors = {
  [FeaturePriority.LOW]: 'bg-gray-100 text-gray-600',
  [FeaturePriority.MEDIUM]: 'bg-blue-100 text-blue-600',
  [FeaturePriority.HIGH]: 'bg-orange-100 text-orange-600',
  [FeaturePriority.CRITICAL]: 'bg-red-100 text-red-600'
}

const statusLabels = {
  [FeatureStatus.PLANNED]: 'Planned',
  [FeatureStatus.IN_PROGRESS]: 'In Progress',
  [FeatureStatus.COMPLETED]: 'Completed',
  [FeatureStatus.ON_HOLD]: 'On Hold',
  [FeatureStatus.CANCELLED]: 'Cancelled'
}

const priorityLabels = {
  [FeaturePriority.LOW]: 'Low',
  [FeaturePriority.MEDIUM]: 'Medium',
  [FeaturePriority.HIGH]: 'High',
  [FeaturePriority.CRITICAL]: 'Critical'
}

function FeatureCard({ 
  feature, 
  onEdit, 
  onDelete, 
  onUpdateStatus, 
  onUpdatePriority, 
  showProductArea = false,
  isSelected = false,
  onSelectionChange,
  showSelection = false
}: {
  feature: Feature & { product_area?: any }
  onEdit?: (feature: Feature) => void
  onDelete?: (featureId: string) => void
  onUpdateStatus?: (featureId: string, status: FeatureStatus) => void
  onUpdatePriority?: (featureId: string, priority: FeaturePriority) => void
  showProductArea?: boolean
  isSelected?: boolean
  onSelectionChange?: (featureId: string, selected: boolean) => void
  showSelection?: boolean
}) {
  return (
    <Card className={`p-6 hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        {showSelection && (
          <div className="mr-3 pt-1">
            <button
              onClick={() => onSelectionChange?.(feature.id, !isSelected)}
              className="text-blue-600 hover:text-blue-700"
            >
              {isSelected ? (
                <CheckSquare className="h-5 w-5" />
              ) : (
                <Square className="h-5 w-5" />
              )}
            </button>
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {feature.name}
          </h3>
          {feature.description && (
            <p className="text-gray-600 mb-3">{feature.description}</p>
          )}
          {showProductArea && feature.product_area && (
            <p className="text-sm text-gray-500 mb-2">
              {feature.product_area.product?.name} {' > '} {feature.product_area.name}
            </p>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(feature)}
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(feature.id)}
              className="text-red-600 hover:text-red-700"
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            {onUpdateStatus ? (
              <Select
                value={feature.status || FeatureStatus.PLANNED}
                onValueChange={(value) => onUpdateStatus(feature.id, value as FeatureStatus)}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            ) : (
              <Badge className={statusColors[feature.status as FeatureStatus]}>
                {statusLabels[feature.status as FeatureStatus]}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Priority:</span>
            {onUpdatePriority ? (
              <Select
                value={feature.priority || FeaturePriority.MEDIUM}
                onValueChange={(value) => onUpdatePriority(feature.id, value as FeaturePriority)}
              >
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            ) : (
              <Badge className={priorityColors[feature.priority as FeaturePriority]}>
                {priorityLabels[feature.priority as FeaturePriority]}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          {feature.effort_score && (
            <span>Effort: {feature.effort_score}/10</span>
          )}
          {feature.business_value && (
            <span>Value: {feature.business_value}/10</span>
          )}
        </div>
      </div>
    </Card>
  )
}

export function FeatureList({
  features,
  onEditFeature,
  onDeleteFeature,
  onUpdateStatus,
  onUpdatePriority,
  showProductArea = false,
  groupByStatus = false,
  selectedFeatures = [],
  onSelectionChange,
  showSelection = false
}: FeatureListProps) {
  const handleSelectionChange = (featureId: string, selected: boolean) => {
    if (!onSelectionChange) return
    
    const newSelection = selected
      ? [...selectedFeatures, featureId]
      : selectedFeatures.filter(id => id !== featureId)
    
    onSelectionChange(newSelection)
  }

  if (features.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No features found</p>
        <p className="text-sm text-gray-400">Create your first feature to get started</p>
      </div>
    )
  }

  if (groupByStatus) {
    const featuresByStatus = features.reduce((acc, feature) => {
      const status = feature.status as FeatureStatus
      if (!acc[status]) acc[status] = []
      acc[status].push(feature)
      return acc
    }, {} as Record<FeatureStatus, Feature[]>)

    return (
      <div className="space-y-8">
        {Object.entries(featuresByStatus).map(([status, statusFeatures]) => (
          <div key={status}>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {statusLabels[status as FeatureStatus]}
              </h3>
              <Badge className={statusColors[status as FeatureStatus]}>
                {statusFeatures.length}
              </Badge>
            </div>
            <div className="grid gap-4">
              {statusFeatures.map((feature) => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  onEdit={onEditFeature}
                  onDelete={onDeleteFeature}
                  onUpdateStatus={onUpdateStatus}
                  onUpdatePriority={onUpdatePriority}
                  showProductArea={showProductArea}
                  isSelected={selectedFeatures.includes(feature.id)}
                  onSelectionChange={handleSelectionChange}
                  showSelection={showSelection}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {features.map((feature) => (
        <FeatureCard
          key={feature.id}
          feature={feature}
          onEdit={onEditFeature}
          onDelete={onDeleteFeature}
          onUpdateStatus={onUpdateStatus}
          onUpdatePriority={onUpdatePriority}
          showProductArea={showProductArea}
          isSelected={selectedFeatures.includes(feature.id)}
          onSelectionChange={handleSelectionChange}
          showSelection={showSelection}
        />
      ))}
    </div>
  )
}
