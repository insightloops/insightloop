import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { CompanyRepository } from '@/lib/repositories/CompanyRepository'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const industry = searchParams.get('industry')
    const size = searchParams.get('size')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const companyRepository = new CompanyRepository(supabase)
    
    const filters: any = {}
    if (industry) filters.industry = industry
    if (size) filters.size = size

    const offset = (page - 1) * limit
    const [companies, total] = await Promise.all([
      companyRepository.findMany(filters, limit, offset),
      companyRepository.count(filters)
    ])

    return NextResponse.json({
      data: companies,
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + companies.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, industry, size, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Auto-generate slug from name if not provided
    const finalSlug = slug || name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .trim()

    const companyRepository = new CompanyRepository(supabase)
    
    // Check if slug already exists
    const existingCompany = await companyRepository.findBySlug(finalSlug)
    if (existingCompany) {
      return NextResponse.json(
        { error: 'Company with this name already exists' },
        { status: 400 }
      )
    }

    const company = await companyRepository.create({
      name,
      slug: finalSlug,
      industry,
      size
    })

    return NextResponse.json({ data: company }, { status: 201 })
  } catch (error) {
    console.error('Error creating company:', error)
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    )
  }
}
