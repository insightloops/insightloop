'use client';

import { useState } from 'react';
import { ProductList } from '@/components/ProductList';
import { ProductForm } from '@/components/ProductForm';
import { useProducts } from '@/hooks/useProducts';
import { useCompanies } from '@/hooks/useCompanies';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface FormData {
  name: string;
  company_id: string;
  description: string;
}

export default function ProductsPage() {
  const { products, loading: productsLoading, error: productsError, createProduct } = useProducts();
  const { companies, loading: companiesLoading } = useCompanies();
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

  if (productsLoading || companiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading products...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {productsError && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {productsError}
          </AlertDescription>
        </Alert>
      )}

      <ProductList 
        products={products} 
        onCreateNew={handleCreateNew}
        showCompanyInfo={true}
      />

      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
          </DialogHeader>
          
          {createError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {createError}
              </AlertDescription>
            </Alert>
          )}

          <ProductForm
            companies={companies}
            onSubmit={handleCreateProduct}
            onCancel={handleCancel}
            isLoading={isCreating}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
