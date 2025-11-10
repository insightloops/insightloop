'use client';

import { useParams } from 'next/navigation';
import { useCompany } from '@/hooks/useCompanies';
import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, Package, Plus, Settings } from 'lucide-react';
import Link from 'next/link';

export default function CompanyDetailPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  
  const { company, loading: companyLoading, error: companyError } = useCompany(companyId);
  const { products, loading: productsLoading, error: productsError } = useProducts(companyId);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (companyLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading company details...</span>
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
    <div className="container mx-auto py-8 space-y-8">
      {/* Company Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
            <p className="text-gray-600">Company ID: {company.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Company Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Industry</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{company.industry || 'Not specified'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Company Size</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold capitalize">{company.size || 'Not specified'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{formatDate(company.created_at)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Products Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <Link href={`/companies/${companyId}/products`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Manage Products
            </Button>
          </Link>
        </div>

        {productsError ? (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {productsError}
            </AlertDescription>
          </Alert>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-600 mb-4">Get started by creating your first product.</p>
                <Link href={`/companies/${companyId}/products`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Product
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    {product.name}
                  </CardTitle>
                  <CardDescription>
                    {product.description || 'No description provided'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Created {formatDate(product.created_at)}
                    </div>
                    <Link href={`/companies/${companyId}/products/${product.id}`}>
                      <Button variant="outline" size="sm">View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
