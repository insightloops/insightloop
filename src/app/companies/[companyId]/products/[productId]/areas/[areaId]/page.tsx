'use client';

import { useParams } from 'next/navigation';
import { useProductArea } from '@/hooks/useProductAreas';
import { useProduct } from '@/hooks/useProducts';
import { useCompany } from '@/hooks/useCompanies';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Target, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProductAreaPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const productId = params.productId as string;
  const areaId = params.areaId as string;
  
  const { company, loading: companyLoading } = useCompany(companyId);
  const { product, loading: productLoading } = useProduct(productId, companyId);
  const { productArea, loading: areaLoading, error: areaError } = useProductArea(areaId, companyId, productId);

  const loading = companyLoading || productLoading || areaLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading product area...</span>
        </div>
      </div>
    );
  }

  if (areaError || !productArea) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-800">
          {areaError || 'Product area not found'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/companies">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Companies
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href={`/companies/${companyId}`}>
          <Button variant="ghost" size="sm">
            {company?.name || 'Company'}
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href={`/companies/${companyId}/products`}>
          <Button variant="ghost" size="sm">
            Products
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href={`/companies/${companyId}/products/${productId}`}>
          <Button variant="ghost" size="sm">
            {product?.name || 'Product'}
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href={`/companies/${companyId}/products/${productId}/areas`}>
          <Button variant="ghost" size="sm">
            Areas
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{productArea.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{productArea.name}</h1>
            <p className="text-gray-600">Product Area</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/companies/${companyId}/products/${productId}/areas/${areaId}/features`}>
            <Button>
              Manage Features
            </Button>
          </Link>
        </div>
      </div>

      {/* Area Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Area Information</CardTitle>
            <CardDescription>Details about this product area</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <p className="text-gray-900">{productArea.name}</p>
            </div>
            
            {productArea.description && (
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-gray-900">{productArea.description}</p>
              </div>
            )}

            {productArea.keywords && productArea.keywords.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700">Keywords</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {productArea.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700">Created</label>
              <p className="text-gray-900">
                {productArea.created_at ? new Date(productArea.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage this product area</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href={`/companies/${companyId}/products/${productId}/areas/${areaId}/features`}>
              <Button className="w-full justify-start" variant="outline">
                <Package className="h-4 w-4 mr-2" />
                View Features
              </Button>
            </Link>
            <Link href={`/companies/${companyId}/products/${productId}/areas`}>
              <Button className="w-full justify-start" variant="outline">
                <Target className="h-4 w-4 mr-2" />
                Back to All Areas
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
