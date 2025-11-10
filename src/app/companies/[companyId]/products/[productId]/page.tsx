'use client';

import { useParams } from 'next/navigation';
import { useProduct } from '@/hooks/useProducts';
import { useCompany } from '@/hooks/useCompanies';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package, Building2, Calendar, Edit, Target, Plus } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const productId = params.productId as string;
  
  const { product, loading: productLoading, error: productError } = useProduct(productId);
  const { company, loading: companyLoading } = useCompany(companyId);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getMetadataEntries = (metadata: any) => {
    if (!metadata || typeof metadata !== 'object') return [];
    return Object.entries(metadata);
  };

  if (productLoading || companyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading product details...</span>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            {company && (
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <Link href={`/companies/${company.id}`} className="hover:text-foreground">
                  {company.name}
                </Link>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created {formatDate(product.created_at)}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Product
          </Button>
          <Link href={`/products/${product.id}/areas`}>
            <Button className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Manage Areas
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>Basic details about this product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-muted-foreground">
                {product.description || 'No description provided'}
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Company</h4>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{company?.name || 'Unknown Company'}</span>
                {company?.industry && (
                  <Badge variant="secondary">{company.industry}</Badge>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Timeline</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(product.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated:</span>
                  <span>{formatDate(product.updated_at)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>Additional product properties</CardDescription>
          </CardHeader>
          <CardContent>
            {getMetadataEntries(product.metadata).length > 0 ? (
              <div className="space-y-2">
                {getMetadataEntries(product.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="font-medium">{key}:</span>
                    <span className="text-muted-foreground">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No metadata available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Areas Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Product Areas</CardTitle>
              <CardDescription>
                Organize features into logical areas within this product
              </CardDescription>
            </div>
            <Link href={`/products/${product.id}/areas`}>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Area
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No product areas yet.</p>
            <p className="text-sm">Create areas to organize your product features.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
