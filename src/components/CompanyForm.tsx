import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2 } from 'lucide-react';

interface CompanyFormData {
  name: string;
  industry: string;
  size: string;
}

interface CompanyFormProps {
  onSubmit: (data: CompanyFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'E-commerce',
  'Education',
  'Manufacturing',
  'Retail',
  'Media',
  'Real Estate',
  'Transportation',
  'Food & Beverage',
  'Energy',
  'Other'
];

const COMPANY_SIZES = [
  { value: 'startup', label: 'Startup (1-10)' },
  { value: 'small', label: 'Small (11-50)' },
  { value: 'medium', label: 'Medium (51-200)' },
  { value: 'large', label: 'Large (201-1000)' },
  { value: 'enterprise', label: 'Enterprise (1000+)' }
];

export function CompanyForm({ onSubmit, onCancel, isLoading = false }: CompanyFormProps) {
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    industry: '',
    size: ''
  });

  const [errors, setErrors] = useState<Partial<CompanyFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CompanyFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
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

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <CardTitle>Create New Company</CardTitle>
        </div>
        <CardDescription>
          Add a new company to organize your products and feedback
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter company name"
              className={errors.name ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select
              value={formData.industry}
              onValueChange={(value) => handleInputChange('industry', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((industry) => (
                  <SelectItem key={industry} value={industry.toLowerCase()}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="size">Company Size</Label>
            <Select
              value={formData.size}
              onValueChange={(value) => handleInputChange('size', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                'Create Company'
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
