import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CompanyService } from '@/lib/services/CompanyService';

export async function GET(request: NextRequest) {
  try {
    const companyService = new CompanyService(supabase);
    const companies = await companyService.getAllCompanies();

    return NextResponse.json({ companies });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      size: body.size
    });

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create company' },
      { status: 500 }
    );
  }
}
