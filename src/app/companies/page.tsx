'use client';

import { useState } from 'react';
import { CompanyList } from '@/components/CompanyList';
import { CompanyForm } from '@/components/CompanyForm';
import { useCompanies } from '@/hooks/useCompanies';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface FormData {
  name: string;
  industry: string;
  size: string;
}

export default function CompaniesPage() {
  const { companies, loading, error, createCompany } = useCompanies();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateCompany = async (formData: FormData) => {
    try {
      setIsCreating(true);
      setCreateError(null);
      
      await createCompany({
        name: formData.name,
        industry: formData.industry || undefined,
        size: formData.size || undefined,
      });
      
      setShowCreateForm(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create company');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateNew = () => {
    setShowCreateForm(true);
    setCreateError(null);
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setCreateError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading companies...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <CompanyList 
        companies={companies} 
        onCreateNew={handleCreateNew}
      />

      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
          </DialogHeader>
          
          {createError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {createError}
              </AlertDescription>
            </Alert>
          )}

          <CompanyForm
            onSubmit={handleCreateCompany}
            onCancel={handleCancel}
            isLoading={isCreating}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
