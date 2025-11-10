'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanies } from '@/hooks/useCompanies';
import { useUserIdSync } from '@/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ProductsPage() {
  const router = useRouter();
  const userId = useUserIdSync();
  const { companies, loading } = useCompanies(userId);

  // If user has only one company, redirect to that company's products
  useEffect(() => {
    if (!loading && companies.length === 1) {
      router.push(`/companies/${companies[0].id}/products`);
    }
  }, [companies, loading, router]);

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

  if (companies.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
              <p className="text-gray-600 mb-4">You need to create a company first before managing products.</p>
              <Link href="/companies">
                <Button>Go to Companies</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Select a Company</h1>
        <p className="text-gray-600">Choose a company to manage its products.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <Card key={company.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                {company.name}
              </CardTitle>
              <CardDescription>
                {company.industry && `${company.industry} • `}
                {company.size && `${company.size} company`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/companies/${company.id}/products`}>
                <Button className="w-full">
                  View Products
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
