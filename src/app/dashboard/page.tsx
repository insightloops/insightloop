'use client'

import Link from "next/link";
import { useState } from "react";
import { InsightsDashboard } from "@/components/InsightsDashboard";
import { EvidenceModal } from "@/components/EvidenceModal";
import { useCompanies } from "@/hooks/useCompanies";
import { useUserIdSync } from "@/hooks";
import { Insight } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Dashboard() {
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState('550e8400-e29b-41d4-a716-446655440000');
  
  const userId = useUserIdSync();
  const { companies, loading: companiesLoading } = useCompanies(userId);

  const handleInsightClick = (insight: Insight) => {
    setSelectedInsight(insight)
  }

  const handleCloseModal = () => {
    setSelectedInsight(null)
  }

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
                className="text-primary font-medium border-b-2 border-primary pb-1"
              >
                Dashboard
              </Link>
              <Link 
                href="/feedback" 
                className="text-muted-foreground hover:text-foreground"
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
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Overview of your product insights</p>
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

        {/* Insights Dashboard */}
        <InsightsDashboard companyId={selectedCompanyId} onInsightClick={handleInsightClick} />

        {/* Quick Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button asChild>
            <Link href={`/feedback?company=${selectedCompanyId}`}>
              Upload New Feedback
            </Link>
          </Button>
          <Button variant="outline">
            Generate Report
          </Button>
        </div>
      </main>

      {/* Evidence Modal */}
      <EvidenceModal
        isOpen={selectedInsight !== null}
        insight={selectedInsight}
        companyId={selectedCompanyId}
        onClose={handleCloseModal}
      />
    </div>
  );
}
