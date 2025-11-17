import React, { useState } from 'react'
import { CheckSquare, Square, Trash2, Edit3, ArrowUp, ArrowDown } from 'lucide-react'
import { Feature, FeatureStatus, FeaturePriority } from '../types'
import { Button } from './ui/button'
import { Select } from './ui/select'
import { Dialog } from './ui/dialog'
import { Card } from './ui/card'

interface BulkOperationsProps {
  features: Feature[]
  selectedFeatures: string[]
  onSelectionChange: (selectedIds: string[]) => void
  onBulkStatusUpdate: (featureIds: string[], status: FeatureStatus) => Promise<void>
  onBulkPriorityUpdate: (featureIds: string[], priority: FeaturePriority) => Promise<void>
  onBulkDelete: (featureIds: string[]) => Promise<void>
}

interface BulkConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText: string
  confirmVariant?: 'default' | 'destructive'
}

const BulkConfirmation: React.FC<BulkConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  confirmVariant = 'default'
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <p className="text-gray-600 mb-6">{description}</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm}>
          {confirmText}
        </Button>
      </div>
    </div>
  </Dialog>
)

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  features,
  selectedFeatures,
  onSelectionChange,
  onBulkStatusUpdate,
  onBulkPriorityUpdate,
  onBulkDelete
}) => {
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [showPriorityDialog, setShowPriorityDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<FeatureStatus>(FeatureStatus.PLANNED)
  const [selectedPriority, setSelectedPriority] = useState<FeaturePriority>(FeaturePriority.MEDIUM)
  const [isProcessing, setIsProcessing] = useState(false)

  const allSelected = features.length > 0 && selectedFeatures.length === features.length
  const someSelected = selectedFeatures.length > 0

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(features.map(f => f.id))
    }
  }

  const handleBulkStatusUpdate = async () => {
    setIsProcessing(true)
    try {
      await onBulkStatusUpdate(selectedFeatures, selectedStatus)
      setShowStatusDialog(false)
      onSelectionChange([]) // Clear selection after operation
    } catch (error) {
      console.error('Bulk status update failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkPriorityUpdate = async () => {
    setIsProcessing(true)
    try {
      await onBulkPriorityUpdate(selectedFeatures, selectedPriority)
      setShowPriorityDialog(false)
      onSelectionChange([]) // Clear selection after operation
    } catch (error) {
      console.error('Bulk priority update failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkDelete = async () => {
    setIsProcessing(true)
    try {
      await onBulkDelete(selectedFeatures)
      setShowDeleteDialog(false)
      onSelectionChange([]) // Clear selection after operation
    } catch (error) {
      console.error('Bulk delete failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (features.length === 0) return null

  return (
    <>
      {/* Bulk Operations Bar */}
      <Card className={`p-4 mb-4 transition-all duration-200 ${someSelected ? 'bg-blue-50 border-blue-200' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Select All Checkbox */}
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm font-medium hover:text-blue-600"
            >
              {allSelected ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : someSelected ? (
                <div className="h-4 w-4 bg-blue-600 rounded border-2 border-blue-600 flex items-center justify-center">
                  <div className="h-1 w-2 bg-white"></div>
                </div>
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span>
                {allSelected ? 'Deselect All' : someSelected ? `${selectedFeatures.length} Selected` : 'Select All'}
              </span>
            </button>

            {/* Selection Info */}
            {someSelected && (
              <span className="text-sm text-gray-600">
                {selectedFeatures.length} of {features.length} features selected
              </span>
            )}
          </div>

          {/* Bulk Actions */}
          {someSelected && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStatusDialog(true)}
                disabled={isProcessing}
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Update Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPriorityDialog(true)}
                disabled={isProcessing}
              >
                <ArrowUp className="h-4 w-4 mr-1" />
                Set Priority
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isProcessing}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Update Status</h2>
          <p className="text-gray-600 mb-4">
            Update the status for {selectedFeatures.length} selected feature{selectedFeatures.length !== 1 ? 's' : ''}:
          </p>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as FeatureStatus)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.values(FeatureStatus).map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowStatusDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleBulkStatusUpdate} disabled={isProcessing}>
              {isProcessing ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Priority Update Dialog */}
      <Dialog open={showPriorityDialog} onOpenChange={setShowPriorityDialog}>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Set Priority</h2>
          <p className="text-gray-600 mb-4">
            Set the priority for {selectedFeatures.length} selected feature{selectedFeatures.length !== 1 ? 's' : ''}:
          </p>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as FeaturePriority)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.values(FeaturePriority).map((priority) => (
                <option key={priority} value={priority}>
                  {priority.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPriorityDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleBulkPriorityUpdate} disabled={isProcessing}>
              {isProcessing ? 'Updating...' : 'Set Priority'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <BulkConfirmation
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleBulkDelete}
        title="Delete Features"
        description={`Are you sure you want to delete ${selectedFeatures.length} selected feature${selectedFeatures.length !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText={isProcessing ? 'Deleting...' : 'Delete Features'}
        confirmVariant="destructive"
      />
    </>
  )
}
