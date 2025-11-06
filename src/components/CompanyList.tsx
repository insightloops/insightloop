import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Users, Package } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  size: string | null;
  created_at: string | null;
}

interface CompanyListProps {
  companies: Company[];
  onCreateNew: () => void;
}

export function CompanyList({ companies, onCreateNew }: CompanyListProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const getSizeColor = (size: string | null) => {
    switch (size) {
      case 'startup': return 'bg-green-100 text-green-800';
      case 'small': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'large': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">
            Manage your companies and their products
          </p>
        </div>
        <Button onClick={onCreateNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Company
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Get started by creating your first company to organize your products and feedback.
            </p>
            <Button onClick={onCreateNew} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create First Company
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                  </div>
                </div>
                <CardDescription>
                  Created {formatDate(company.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {company.industry && (
                      <Badge variant="secondary">{company.industry}</Badge>
                    )}
                    {company.size && (
                      <Badge className={getSizeColor(company.size)}>
                        {company.size}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        Products
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Features
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/companies/${company.id}/products`}>
                        <Button variant="outline" size="sm">
                          Products
                        </Button>
                      </Link>
                      <Link href={`/companies/${company.id}`}>
                        <Button variant="outline" size="sm">
                          Details
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
