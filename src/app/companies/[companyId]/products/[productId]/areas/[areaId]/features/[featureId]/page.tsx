'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useProductArea } from '@/hooks/useProductAreas';
import { useProduct } from '@/hooks/useProducts';
import { useCompany } from '@/hooks/useCompanies';
import { useUserIdSync } from '@/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Zap, Star, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeatureStatus, FeaturePriority, Feature } from '@/types/database';
import Link from 'next/link';

const statusIcons = {
  [FeatureStatus.PLANNED]: AlertCircle,
  [FeatureStatus.IN_PROGRESS]: Clock,
  [FeatureStatus.COMPLETED]: CheckCircle,
  [FeatureStatus.ON_HOLD]: Clock,
  [FeatureStatus.CANCELLED]: XCircle,
};

const statusColors = {
  [FeatureStatus.PLANNED]: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  [FeatureStatus.IN_PROGRESS]: 'text-blue-600 bg-blue-50 border-blue-200',
  [FeatureStatus.COMPLETED]: 'text-green-700 bg-green-100 border-green-300',
  [FeatureStatus.ON_HOLD]: 'text-gray-600 bg-gray-50 border-gray-200',
  [FeatureStatus.CANCELLED]: 'text-red-600 bg-red-50 border-red-200',
};

const priorityColors = {
  [FeaturePriority.LOW]: 'bg-gray-100 text-gray-800',
  [FeaturePriority.MEDIUM]: 'bg-yellow-100 text-yellow-800',
  [FeaturePriority.HIGH]: 'bg-orange-100 text-orange-800',
  [FeaturePriority.CRITICAL]: 'bg-red-100 text-red-800',
};

// Hook to fetch individual feature
function useFeature(featureId: string) {
  const [feature, setFeature] = useState<Feature | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = useUserIdSync();

  useEffect(() => {
    if (!featureId || !userId) return;

    const fetchFeature = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/features/${featureId}`, {
          headers: {
            'x-user-id': userId,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Feature not found');
        }

        const data = await response.json();
        setFeature(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchFeature();
  }, [featureId, userId]);

  return { feature, loading, error };
}

export default function FeaturePage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const productId = params.productId as string;
  const areaId = params.areaId as string;
  const featureId = params.featureId as string;
  
  const { company, loading: companyLoading } = useCompany(companyId);
  const { product, loading: productLoading } = useProduct(productId);
  const { productArea, loading: areaLoading } = useProductArea(areaId);
  const { feature, loading: featureLoading, error: featureError } = useFeature(featureId);

  const loading = companyLoading || productLoading || areaLoading || featureLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading feature...</span>
        </div>
      </div>
    );
  }

  if (featureError || !feature) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-800">
          {featureError || 'Feature not found'}
        </AlertDescription>
      </Alert>
    );
  }

  const StatusIcon = statusIcons[feature.status as FeatureStatus] || AlertCircle;

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
        <Link href={`/companies/${companyId}/products/${productId}/areas/${areaId}`}>
          <Button variant="ghost" size="sm">
            {productArea?.name || 'Area'}
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href={`/companies/${companyId}/products/${productId}/areas/${areaId}/features`}>
          <Button variant="ghost" size="sm">
            Features
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{feature.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{feature.name}</h1>
            <p className="text-gray-600">Feature</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${statusColors[feature.status as FeatureStatus]} flex items-center gap-1`}>
            <StatusIcon className="h-3 w-3" />
            {feature.status?.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </Badge>
          {feature.priority && (
            <Badge className={priorityColors[feature.priority as FeaturePriority]}>
              <Star className="h-3 w-3 mr-1" />
              {feature.priority}
            </Badge>
          )}
        </div>
      </div>

      {/* Feature Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Feature Information</CardTitle>
            <CardDescription>Details about this feature</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <p className="text-gray-900">{feature.name}</p>
            </div>
            
            {feature.description && (
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-gray-900">{feature.description}</p>
              </div>
            )}

            {feature.metadata && typeof feature.metadata === 'object' && feature.metadata !== null && 'keywords' in feature.metadata && Array.isArray((feature.metadata as any).keywords) && (
              <div>
                <label className="text-sm font-medium text-gray-700">Keywords</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {((feature.metadata as any).keywords as string[]).map((keyword: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="flex items-center gap-2 mt-1">
                  <StatusIcon className="h-4 w-4" />
                  <span className="text-gray-900">
                    {feature.status?.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                </div>
              </div>
              
              {feature.priority && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Priority</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="h-4 w-4" />
                    <span className="text-gray-900">{feature.priority}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Created</label>
              <p className="text-gray-900">
                {feature.created_at ? new Date(feature.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage this feature</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href={`/companies/${companyId}/products/${productId}/areas/${areaId}/features`}>
              <Button className="w-full justify-start" variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Back to All Features
              </Button>
            </Link>
            <Link href={`/companies/${companyId}/products/${productId}/areas/${areaId}`}>
              <Button className="w-full justify-start" variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Area
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
