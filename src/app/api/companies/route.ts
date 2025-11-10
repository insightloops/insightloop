import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CompanyService } from '@/lib/services/CompanyService';
import { createAuthenticatedHandler, AuthenticatedRequest } from '@/lib/middleware/auth';

async function handleGET(request: AuthenticatedRequest) {
  try {
    const companyService = new CompanyService(supabase);
    const companies = await companyService.getCompaniesForUser(request.userId);

    return NextResponse.json({ companies });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

async function handlePOST(request: AuthenticatedRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    const companyService = new CompanyService(supabase);
    const company = await companyService.createCompany({
      name: body.name,
      industry: body.industry,
      size: body.size,
      userId: request.userId
    });

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create company' },
      { status: 500 }
    );
  }
}

// Export authenticated handlers
export const GET = createAuthenticatedHandler(handleGET);
export const POST = createAuthenticatedHandler(handlePOST);
