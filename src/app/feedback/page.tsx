'use client'

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FeedbackUpload } from "@/components/FeedbackUpload";
import { useCompanies } from "@/hooks/useCompanies";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Feedback() {
  const searchParams = useSearchParams();
  const [selectedCompanyId, setSelectedCompanyId] = useState('550e8400-e29b-41d4-a716-446655440000');
  
  const { companies, loading: companiesLoading } = useCompanies();

  // Check for company parameter in URL
  useEffect(() => {
    const companyParam = searchParams.get('company');
    if (companyParam) {
      setSelectedCompanyId(companyParam);
    }
  }, [searchParams]);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
              InsightLoop
            </Link>
            <div className="flex items-center space-x-6">
              <Link 
                href="/dashboard" 
                className="text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link 
                href="/feedback" 
                className="text-primary font-medium border-b-2 border-primary pb-1"
              >
                Feedback
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Header with Company Selector */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Upload Feedback</h1>
            <p className="text-muted-foreground">Upload CSV files to analyze customer feedback and generate insights</p>
          </div>
          
          {!companiesLoading && companies.length > 0 && (
            <div className="flex items-center space-x-3">
              <Label htmlFor="company-select">
                Company:
              </Label>
              <Select
                value={selectedCompanyId}
                onValueChange={setSelectedCompanyId}
              >
                <SelectTrigger id="company-select" className="w-64">
                  <SelectValue placeholder="Select company..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name} ({company.industry})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Company Info */}
        {selectedCompany && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{selectedCompany.name}</CardTitle>
              <CardDescription>{selectedCompany.industry} • {selectedCompany.size}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Feedback Upload Component */}
        <FeedbackUpload companyId={selectedCompanyId} />
      </main>
    </div>
  );
}
