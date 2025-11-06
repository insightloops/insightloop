'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select } from './ui/select'
import { FeatureInsert, FeatureUpdate, FeatureStatus, FeaturePriority, ProductArea } from '@/types/database'

interface FeatureFormProps {
  initialData?: Partial<FeatureUpdate>
  companyId: string
  productAreaId?: string
  productAreas: ProductArea[]
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

const statusOptions = [
  { value: FeatureStatus.PLANNED, label: 'Planned' },
  { value: FeatureStatus.IN_PROGRESS, label: 'In Progress' },
  { value: FeatureStatus.COMPLETED, label: 'Completed' },
  { value: FeatureStatus.ON_HOLD, label: 'On Hold' },
  { value: FeatureStatus.CANCELLED, label: 'Cancelled' }
]

const priorityOptions = [
  { value: FeaturePriority.LOW, label: 'Low' },
  { value: FeaturePriority.MEDIUM, label: 'Medium' },
  { value: FeaturePriority.HIGH, label: 'High' },
  { value: FeaturePriority.CRITICAL, label: 'Critical' }
]

export function FeatureForm({
  initialData,
  companyId,
  productAreaId,
  productAreas,
  onSubmit,
  onCancel,
  submitLabel = 'Create Feature'
}: FeatureFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    product_area_id: productAreaId || initialData?.product_area_id || '',
    status: initialData?.status || FeatureStatus.PLANNED,
    priority: initialData?.priority || FeaturePriority.MEDIUM,
    effort_score: initialData?.effort_score || undefined,
    business_value: initialData?.business_value || undefined
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Feature name is required'
    }

    if (!formData.product_area_id) {
      newErrors.product_area_id = 'Product area is required'
    }

    if (formData.effort_score !== undefined && (formData.effort_score < 1 || formData.effort_score > 10)) {
      newErrors.effort_score = 'Effort score must be between 1 and 10'
    }

    if (formData.business_value !== undefined && (formData.business_value < 1 || formData.business_value > 10)) {
      newErrors.business_value = 'Business value must be between 1 and 10'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const submitData = {
        ...formData,
        company_id: companyId,
        effort_score: formData.effort_score || null,
        business_value: formData.business_value || null
      }

      await onSubmit(submitData)
    } catch (error: any) {
      setErrors({ submit: error.message })
    } finally {
      setLoading(false)
    }
  }

  const getProductAreaDisplay = (area: ProductArea): string => {
    if (area.parent_area_id) {
      const parent = productAreas.find(p => p.id === area.parent_area_id)
      return parent ? `${parent.name} > ${area.name}` : area.name
    }
    return area.name
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Feature Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter feature name..."
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the feature..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="product_area_id">Product Area</Label>
          <Select
            value={formData.product_area_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, product_area_id: value }))}
          >
            <option value="">Select product area...</option>
            {productAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {getProductAreaDisplay(area)}
              </option>
            ))}
          </Select>
          {errors.product_area_id && (
            <p className="text-sm text-red-600 mt-1">{errors.product_area_id}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as FeatureStatus }))}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as FeaturePriority }))}
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="effort_score">Effort Score (1-10)</Label>
            <Input
              id="effort_score"
              type="number"
              min="1"
              max="10"
              value={formData.effort_score || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                effort_score: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              placeholder="Effort required (1-10)"
              className={errors.effort_score ? 'border-red-500' : ''}
            />
            {errors.effort_score && (
              <p className="text-sm text-red-600 mt-1">{errors.effort_score}</p>
            )}
          </div>

          <div>
            <Label htmlFor="business_value">Business Value (1-10)</Label>
            <Input
              id="business_value"
              type="number"
              min="1"
              max="10"
              value={formData.business_value || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                business_value: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              placeholder="Business impact (1-10)"
              className={errors.business_value ? 'border-red-500' : ''}
            />
            {errors.business_value && (
              <p className="text-sm text-red-600 mt-1">{errors.business_value}</p>
            )}
          </div>
        </div>
      </div>

      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
