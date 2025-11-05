import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { CompanyRepository } from '@/lib/repositories/CompanyRepository'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params
    const companyRepository = new CompanyRepository(supabase)
    const company = await companyRepository.findById(companyId)

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: company })
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params
    const body = await request.json()
    const { name, slug, industry, size } = body

    const companyRepository = new CompanyRepository(supabase)
    
    // Check if company exists
    const existingCompany = await companyRepository.findById(companyId)
    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // If slug is being changed, check if new slug is available
    if (slug && slug !== existingCompany.slug) {
      const companyWithSlug = await companyRepository.findBySlug(slug)
      if (companyWithSlug) {
        return NextResponse.json(
          { error: 'Company with this slug already exists' },
          { status: 400 }
        )
      }
    }

    const updatedCompany = await companyRepository.update(companyId, {
      name,
      slug,
      industry,
      size
    })

    return NextResponse.json({ data: updatedCompany })
  } catch (error) {
    console.error('Error updating company:', error)
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params
    const companyRepository = new CompanyRepository(supabase)
    
    // Check if company exists
    const existingCompany = await companyRepository.findById(companyId)
    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    await companyRepository.delete(companyId)

    return NextResponse.json({ message: 'Company deleted successfully' })
  } catch (error) {
    console.error('Error deleting company:', error)
    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    )
  }
}
