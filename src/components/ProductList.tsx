import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Building2, Target, Calendar } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  company_id: string;
  description: string | null;
  metadata: any;
  created_at: string | null;
  updated_at: string | null;
}

interface ProductListProps {
  products: Product[];
  companyName?: string;
  companyId?: string;
  onCreateNew: () => void;
  showCompanyInfo?: boolean;
}

export function ProductList({ 
  products, 
  companyName, 
  companyId,
  onCreateNew, 
  showCompanyInfo = false 
}: ProductListProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const getMetadataInfo = (metadata: any) => {
    if (!metadata || typeof metadata !== 'object') return null;
    
    const keys = Object.keys(metadata);
    if (keys.length === 0) return null;
    
    return `${keys.length} properties`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {companyName ? `${companyName} Products` : 'Products'}
          </h1>
          <p className="text-muted-foreground">
            Manage products and their areas within {companyName || 'your companies'}
          </p>
        </div>
        <Button onClick={onCreateNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create your first product to start organizing features and feedback.
            </p>
            <Button onClick={onCreateNew} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                  </div>
                </div>
                <CardDescription>
                  {product.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {showCompanyInfo && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Company
                      </Badge>
                    )}
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(product.created_at)}
                    </Badge>
                    {getMetadataInfo(product.metadata) && (
                      <Badge variant="outline">
                        {getMetadataInfo(product.metadata)}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        Areas
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        Features
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={companyId ? `/companies/${companyId}/products/${product.id}/areas` : `/products/${product.id}/areas`}>
                        <Button variant="outline" size="sm">
                          Areas
                        </Button>
                      </Link>
                      <Link href={companyId ? `/companies/${companyId}/products/${product.id}` : `/products/${product.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
