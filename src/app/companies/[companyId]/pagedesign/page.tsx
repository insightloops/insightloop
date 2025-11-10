'use client';

import { useParams } from 'next/navigation';
import { useCompany } from '@/hooks/useCompanies';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PageDesignPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  
  const { company, loading, error } = useCompany(companyId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading company...</span>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-800">
          {error || 'Company not found'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
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
        <span className="font-medium">Page Design</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Page Design</h1>
          <p className="text-gray-600">Design and manage pages for {company.name}</p>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Company Page Design</CardTitle>
          <CardDescription>
            Configure the design and layout for {company.name}'s pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Page Design Coming Soon</h3>
              <p className="text-gray-600 mb-4">
                This section will allow you to customize the design and layout of pages for {company.name}.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href={`/companies/${company.id}/products`}>
                  <Button>
                    Manage Products
                  </Button>
                </Link>
                <Link href={`/companies/${company.id}`}>
                  <Button variant="outline">
                    Back to Company
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
