'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ProductAreaList } from '@/components/ProductAreaList';
import { ProductAreaForm } from '@/components/ProductAreaForm';
import { useProductAreas } from '@/hooks/useProductAreas';
import { useProduct } from '@/hooks/useProducts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface FormData {
  name: string;
  product_id: string;
  description: string;
  parent_area_id: string;
  keywords: string[];
}

export default function ProductAreasPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const productId = params.productId as string;
  
  const { product, loading: productLoading, error: productError } = useProduct(productId);
  const { productAreas, loading: areasLoading, error: areasError, createProductArea } = useProductAreas(productId, true);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateArea = async (formData: FormData) => {
    try {
      setIsCreating(true);
      setCreateError(null);
      
      await createProductArea({
        name: formData.name,
        product_id: formData.product_id,
        description: formData.description || undefined,
        parent_area_id: formData.parent_area_id || undefined,
        keywords: formData.keywords.length > 0 ? formData.keywords : undefined,
      });
      
      setShowCreateForm(false);
      setSelectedParentId(undefined);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create product area');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateNew = (parentId?: string) => {
    setSelectedParentId(parentId);
    setShowCreateForm(true);
    setCreateError(null);
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setSelectedParentId(undefined);
    setCreateError(null);
  };

  const selectedParentArea = selectedParentId 
    ? productAreas.find(area => area.id === selectedParentId)
    : undefined;

  if (productLoading || areasLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading product areas...</span>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-800">
          {productError || 'Product not found'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/products">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Products
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href={`/products/${product.id}`}>
          <Button variant="ghost" size="sm">
            {product.name}
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">Areas</span>
      </div>

      {areasError && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {areasError}
          </AlertDescription>
        </Alert>
      )}

      <ProductAreaList 
        productAreas={productAreas} 
        productName={product.name}
        onCreateNew={handleCreateNew}
      />

      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {selectedParentArea ? 'Create Sub-area' : 'Create Product Area'}
            </DialogTitle>
          </DialogHeader>
          
          {createError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {createError}
              </AlertDescription>
            </Alert>
          )}

          <ProductAreaForm
            productId={product.id}
            productName={product.name}
            parentAreaId={selectedParentId}
            parentAreaName={selectedParentArea?.name}
            availableParentAreas={productAreas}
            onSubmit={handleCreateArea}
            onCancel={handleCancel}
            isLoading={isCreating}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
