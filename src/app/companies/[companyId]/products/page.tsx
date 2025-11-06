'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ProductList } from '@/components/ProductList';
import { ProductForm } from '@/components/ProductForm';
import { useProducts } from '@/hooks/useProducts';
import { useCompany } from '@/hooks/useCompanies';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface FormData {
  name: string;
  company_id: string;
  description: string;
}

export default function CompanyProductsPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  
  const { company, loading: companyLoading, error: companyError } = useCompany(companyId);
  const { products, loading: productsLoading, error: productsError, createProduct } = useProducts(companyId);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateProduct = async (formData: FormData) => {
    try {
      setIsCreating(true);
      setCreateError(null);
      
      await createProduct({
        name: formData.name,
        company_id: formData.company_id,
        description: formData.description || undefined,
      });
      
      setShowCreateForm(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create product');
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

  if (companyLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading company products...</span>
        </div>
      </div>
    );
  }

  if (companyError || !company) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-800">
          {companyError || 'Company not found'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/companies">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Companies
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href={`/companies/${company.id}`}>
          <Button variant="ghost" size="sm">
            {company.name}
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">Products</span>
      </div>

      {productsError && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {productsError}
          </AlertDescription>
        </Alert>
      )}

      <ProductList 
        products={products} 
        companyName={company.name}
        onCreateNew={handleCreateNew}
        showCompanyInfo={false}
      />

      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Product for {company.name}</DialogTitle>
          </DialogHeader>
          
          {createError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {createError}
              </AlertDescription>
            </Alert>
          )}

          <ProductForm
            companies={[company]}
            selectedCompanyId={company.id}
            onSubmit={handleCreateProduct}
            onCancel={handleCancel}
            isLoading={isCreating}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
