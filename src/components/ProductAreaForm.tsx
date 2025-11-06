import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Loader2, X, Plus, Tag } from 'lucide-react';

interface ProductArea {
  id: string;
  name: string;
  product_id: string;
  description: string | null;
  parent_area_id: string | null;
  keywords: string[] | null;
  metadata: any;
}

interface ProductAreaFormData {
  name: string;
  product_id: string;
  description: string;
  parent_area_id: string;
  keywords: string[];
}

interface ProductAreaFormProps {
  productId: string;
  productName?: string;
  parentAreaId?: string;
  parentAreaName?: string;
  availableParentAreas?: ProductArea[];
  onSubmit: (data: ProductAreaFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductAreaForm({ 
  productId,
  productName,
  parentAreaId,
  parentAreaName,
  availableParentAreas = [],
  onSubmit, 
  onCancel, 
  isLoading = false 
}: ProductAreaFormProps) {
  const [formData, setFormData] = useState<ProductAreaFormData>({
    name: '',
    product_id: productId,
    description: '',
    parent_area_id: parentAreaId || '',
    keywords: []
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [errors, setErrors] = useState<Partial<ProductAreaFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ProductAreaFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Area name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleInputChange = (field: keyof ProductAreaFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const addKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !formData.keywords.includes(keyword)) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(keyword => keyword !== keywordToRemove)
    }));
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const getAreaHierarchy = (areaId: string): string => {
    const area = availableParentAreas.find(a => a.id === areaId);
    if (!area) return '';
    
    let hierarchy = area.name;
    if (area.parent_area_id) {
      const parentHierarchy = getAreaHierarchy(area.parent_area_id);
      hierarchy = parentHierarchy ? `${parentHierarchy} > ${hierarchy}` : hierarchy;
    }
    return hierarchy;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          <CardTitle>
            {parentAreaId ? 'Create Sub-area' : 'Create Root Area'}
          </CardTitle>
        </div>
        <CardDescription>
          {parentAreaId 
            ? `Add a new sub-area under "${parentAreaName}"`
            : `Add a new root area to ${productName || 'the product'}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm">
              <span className="font-medium">Product:</span> {productName || 'Unknown Product'}
              {parentAreaName && (
                <>
                  <br />
                  <span className="font-medium">Parent Area:</span> {parentAreaName}
                </>
              )}
            </div>
          </div>

          {/* Parent Area Selection (only if not pre-selected) */}
          {!parentAreaId && availableParentAreas.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="parent_area">Parent Area (Optional)</Label>
              <Select
                value={formData.parent_area_id}
                onValueChange={(value) => handleInputChange('parent_area_id', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent area or leave empty for root area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Root Area (No Parent)</SelectItem>
                  {availableParentAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      <div className="flex flex-col items-start">
                        <span>{area.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {getAreaHierarchy(area.id)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Area Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Area Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter area name"
              className={errors.name ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what this area covers..."
              className="min-h-[80px]"
              disabled={isLoading}
            />
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords</Label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={handleKeywordKeyPress}
                  placeholder="Enter keyword and press Enter"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addKeyword}
                  disabled={!keywordInput.trim() || isLoading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {keyword}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeKeyword(keyword)}
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                Keywords help categorize and search for this area
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Area'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
