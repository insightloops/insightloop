'use client'

import { useState, useRef, useCallback } from 'react'
import { useFeedback } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface CSVMapping {
  contentColumn: string
  sentimentColumn?: string
  productAreaColumn?: string
  submittedAtColumn?: string
  userMetadataColumns?: string[]
}

interface FeedbackUploadProps {
  companyId: string
  onUploadSuccess?: (count: number) => void
  onUploadError?: (error: string) => void
}

export function FeedbackUpload({ companyId, onUploadSuccess, onUploadError }: FeedbackUploadProps) {
  const { uploadCSV, uploading } = useFeedback(companyId)
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<CSVMapping>({
    contentColumn: '',
    sentimentColumn: '',
    productAreaColumn: '',
    submittedAtColumn: '',
    userMetadataColumns: []
  })
  const [showMapping, setShowMapping] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }, [])

  const handleFile = useCallback(async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      onUploadError?.('Please select a CSV file')
      return
    }

    setFile(selectedFile)

    // Parse CSV headers
    const text = await selectedFile.text()
    const lines = text.split('\n')
    if (lines.length > 0) {
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      setCsvHeaders(headers)
      setMapping(prev => ({
        ...prev,
        contentColumn: headers.find(h => 
          h.toLowerCase().includes('content') || 
          h.toLowerCase().includes('feedback') || 
          h.toLowerCase().includes('comment')
        ) || ''
      }))
      setShowMapping(true)
    }
  }, [onUploadError])

  const handleUpload = useCallback(async () => {
    if (!file || !mapping.contentColumn) {
      onUploadError?.('Please select a file and map the content column')
      return
    }

    try {
      await uploadCSV(file, mapping)
      onUploadSuccess?.(0) // We don't have the count in the current response
      setFile(null)
      setShowMapping(false)
      setCsvHeaders([])
      setMapping({
        contentColumn: '',
        sentimentColumn: '',
        productAreaColumn: '',
        submittedAtColumn: '',
        userMetadataColumns: []
      })
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed')
    }
  }, [file, mapping, uploadCSV, onUploadSuccess, onUploadError])

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-6">
      {/* File Drop Zone */}
      <Card
        className={`
          relative border-2 border-dashed transition-colors cursor-pointer
          ${dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleChange}
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 text-muted-foreground">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            <div>
              <p className="text-lg font-medium">
                {file ? file.name : 'Drop your CSV file here'}
              </p>
              <p className="text-sm text-muted-foreground">
                or{' '}
                <Button
                  variant="link"
                  onClick={onButtonClick}
                  className="p-0 h-auto text-sm"
                >
                  browse files
                </Button>
              </p>
            </div>
            
            <p className="text-xs text-muted-foreground">
              CSV files only. Maximum file size: 10MB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Column Mapping */}
      {showMapping && csvHeaders.length > 0 && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Map CSV Columns</CardTitle>
            <CardDescription>
              Map your CSV columns to the appropriate feedback fields
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Required: Content Column */}
              <div className="space-y-2">
                <Label htmlFor="content-column">
                  Feedback Content *
                </Label>
                <Select
                  value={mapping.contentColumn}
                  onValueChange={(value) => setMapping(prev => ({ ...prev, contentColumn: value }))}
                >
                  <SelectTrigger id="content-column">
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    {csvHeaders.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Optional: Sentiment Column */}
              <div className="space-y-2">
                <Label htmlFor="sentiment-column">
                  Sentiment (optional)
                </Label>
                <Select
                  value={mapping.sentimentColumn || 'none'}
                  onValueChange={(value) => setMapping(prev => ({ ...prev, sentimentColumn: value === 'none' ? undefined : value }))}
                >
                  <SelectTrigger id="sentiment-column">
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {csvHeaders.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Optional: Product Area Column */}
              <div className="space-y-2">
                <Label htmlFor="product-area-column">
                  Product Area (optional)
                </Label>
                <Select
                  value={mapping.productAreaColumn || 'none'}
                  onValueChange={(value) => setMapping(prev => ({ ...prev, productAreaColumn: value === 'none' ? undefined : value }))}
                >
                  <SelectTrigger id="product-area-column">
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {csvHeaders.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Optional: Submitted At Column */}
              <div className="space-y-2">
                <Label htmlFor="submitted-at-column">
                  Submitted Date (optional)
                </Label>
                <Select
                  value={mapping.submittedAtColumn || 'none'}
                  onValueChange={(value) => setMapping(prev => ({ ...prev, submittedAtColumn: value === 'none' ? undefined : value }))}
                >
                  <SelectTrigger id="submitted-at-column">
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {csvHeaders.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Upload Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMapping(false)
                  setFile(null)
                  setCsvHeaders([])
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!mapping.contentColumn || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Feedback'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Indicator */}
      {uploading && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-3"></div>
              <p className="text-sm text-primary">Processing your CSV file...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
