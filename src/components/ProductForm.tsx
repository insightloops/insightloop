import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Loader2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  size: string | null;
}

interface ProductFormData {
  name: string;
  company_id: string;
  description: string;
}

interface ProductFormProps {
  companies: Company[];
  selectedCompanyId?: string;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductForm({ 
  companies, 
  selectedCompanyId, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    company_id: selectedCompanyId || '',
    description: ''
  });

  const [errors, setErrors] = useState<Partial<ProductFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ProductFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.company_id) {
      newErrors.company_id = 'Please select a company';
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

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const selectedCompany = companies.find(c => c.id === formData.company_id);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <CardTitle>Create New Product</CardTitle>
        </div>
        <CardDescription>
          Add a new product to organize features and product areas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company">Company *</Label>
            <Select
              value={formData.company_id}
              onValueChange={(value) => handleInputChange('company_id', value)}
              disabled={isLoading || !!selectedCompanyId}
            >
              <SelectTrigger className={errors.company_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    <div className="flex items-center gap-2">
                      <span>{company.name}</span>
                      {company.industry && (
                        <span className="text-xs text-muted-foreground">
                          ({company.industry})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.company_id && (
              <p className="text-sm text-red-500">{errors.company_id}</p>
            )}
            {selectedCompany && (
              <p className="text-sm text-muted-foreground">
                Product will be added to {selectedCompany.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter product name"
              className={errors.name ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what this product does..."
              className="min-h-[100px]"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Optional: Provide a brief description of the product
            </p>
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
                'Create Product'
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
