'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Company {
  name: string
  industry: string
  size: string
  description: string
}

interface Product {
  name: string
  type: string
  description: string
}

interface StepperProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
}

const Stepper: React.FC<StepperProps> = ({ currentStep, totalSteps, stepLabels }) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-center">
        {stepLabels.map((label, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index < currentStep
                    ? 'bg-primary border-primary text-primary-foreground'
                    : index === currentStep
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-muted border-border text-muted-foreground'
                }`}
              >
                {index < currentStep ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span className={`mt-2 text-sm font-medium ${
                index <= currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {label}
              </span>
            </div>
            {index < totalSteps - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 ${
                  index < currentStep ? 'bg-primary' : 'bg-border'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

interface CompanyStepProps {
  company: Company
  setCompany: (company: Company) => void
  onNext: () => void
}

const CompanyStep: React.FC<CompanyStepProps> = ({ company, setCompany, onNext }) => {
  const [errors, setErrors] = useState<Partial<Company>>({})

  const validateForm = () => {
    const newErrors: Partial<Company> = {}
    
    if (!company.name.trim()) {
      newErrors.name = 'Company name is required'
    }
    
    if (!company.industry.trim()) {
      newErrors.industry = 'Industry is required'
    }
    
    if (!company.size.trim()) {
      newErrors.size = 'Company size is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateForm()) {
      onNext()
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Tell us about your company</h2>
        <p className="text-muted-foreground">Help us understand your business so we can provide better insights.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="company-name">
            Company Name *
          </Label>
          <Input
            id="company-name"
            value={company.name}
            onChange={(e) => setCompany({ ...company, name: e.target.value })}
            placeholder="Enter your company name"
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">
            Industry *
          </Label>
          <Select value={company.industry} onValueChange={(value) => setCompany({ ...company, industry: value })}>
            <SelectTrigger className={errors.industry ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Education">Education</SelectItem>
              <SelectItem value="Retail">Retail</SelectItem>
              <SelectItem value="Manufacturing">Manufacturing</SelectItem>
              <SelectItem value="Real Estate">Real Estate</SelectItem>
              <SelectItem value="Consulting">Consulting</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.industry && <p className="text-sm text-destructive">{errors.industry}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="size">
            Company Size *
          </Label>
          <Select value={company.size} onValueChange={(value) => setCompany({ ...company, size: value })}>
            <SelectTrigger className={errors.size ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select company size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1-10 employees</SelectItem>
              <SelectItem value="11-50">11-50 employees</SelectItem>
              <SelectItem value="51-200">51-200 employees</SelectItem>
              <SelectItem value="201-1000">201-1000 employees</SelectItem>
              <SelectItem value="1000+">1000+ employees</SelectItem>
            </SelectContent>
          </Select>
          {errors.size && <p className="text-sm text-destructive">{errors.size}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Company Description
          </Label>
          <Textarea
            id="description"
            rows={3}
            value={company.description}
            onChange={(e) => setCompany({ ...company, description: e.target.value })}
            placeholder="Tell us about your company (optional)"
          />
        </div>

        <Button onClick={handleNext} className="w-full" size="lg">
          Continue to Product Setup
        </Button>
      </div>
    </div>
  )
}

interface ProductStepProps {
  product: Product
  setProduct: (product: Product) => void
  onNext: () => void
  onBack: () => void
}

const ProductStep: React.FC<ProductStepProps> = ({ product, setProduct, onNext, onBack }) => {
  const [errors, setErrors] = useState<Partial<Product>>({})

  const validateForm = () => {
    const newErrors: Partial<Product> = {}
    
    if (!product.name.trim()) {
      newErrors.name = 'Product name is required'
    }
    
    if (!product.type.trim()) {
      newErrors.type = 'Product type is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateForm()) {
      onNext()
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Tell us about your product</h2>
        <p className="text-muted-foreground">This helps us provide more relevant insights for your specific product.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="product-name">
            Product Name *
          </Label>
          <Input
            id="product-name"
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
            placeholder="Enter your product name"
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-type">
            Product Type *
          </Label>
          <Select value={product.type} onValueChange={(value) => setProduct({ ...product, type: value })}>
            <SelectTrigger className={errors.type ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select product type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Web Application">Web Application</SelectItem>
              <SelectItem value="Mobile App">Mobile App</SelectItem>
              <SelectItem value="SaaS Platform">SaaS Platform</SelectItem>
              <SelectItem value="E-commerce">E-commerce</SelectItem>
              <SelectItem value="API/Service">API/Service</SelectItem>
              <SelectItem value="Physical Product">Physical Product</SelectItem>
              <SelectItem value="Other Software">Other Software</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-description">
            Product Description
          </Label>
          <Textarea
            id="product-description"
            rows={3}
            value={product.description}
            onChange={(e) => setProduct({ ...product, description: e.target.value })}
            placeholder="Describe your product and what it does (optional)"
          />
        </div>

        <div className="flex space-x-4">
          <Button onClick={onBack} variant="outline" className="flex-1" size="lg">
            Back
          </Button>
          <Button onClick={handleNext} className="flex-1" size="lg">
            Complete Setup
          </Button>
        </div>
      </div>
    </div>
  )
}

interface LoadingStepProps {
  company: Company
  product: Product
}

const LoadingStep: React.FC<LoadingStepProps> = ({ company, product }) => {
  const router = useRouter()
  const [status, setStatus] = useState('Creating your company...')
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    const createCompanyAndProduct = async () => {
      try {
        // Create company
        setStatus('Creating your company...')
        const companyResponse = await fetch('/api/companies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(company),
        })

        if (!companyResponse.ok) {
          throw new Error('Failed to create company')
        }

        const createdCompany = await companyResponse.json()

        // Create product
        setStatus('Setting up your product...')
        const productResponse = await fetch(`/api/companies/${createdCompany.id}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(product),
        })

        if (!productResponse.ok) {
          throw new Error('Failed to create product')
        }

        setStatus('Finalizing setup...')
        
        // Small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Redirect to dashboard with the new company ID
        router.push(`/dashboard?company=${createdCompany.id}`)

      } catch (error) {
        console.error('Setup error:', error)
        setError(error instanceof Error ? error.message : 'An error occurred during setup')
      }
    }

    createCompanyAndProduct()
  }, [company, product, router])

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="text-destructive mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Setup Failed</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="text-primary mb-4">
        <svg className="animate-spin w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Setting up your account</h2>
      <p className="text-muted-foreground">{status}</p>
    </div>
  )
}

const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [company, setCompany] = useState<Company>({
    name: '',
    industry: '',
    size: '',
    description: '',
  })
  const [product, setProduct] = useState<Product>({
    name: '',
    type: '',
    description: '',
  })

  const stepLabels = ['Company Info', 'Product Setup', 'Complete']

  const handleNext = () => {
    setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Stepper
          currentStep={currentStep}
          totalSteps={stepLabels.length}
          stepLabels={stepLabels}
        />

        <Card className="mt-8">
          <CardContent className="p-8">
            {currentStep === 0 && (
              <CompanyStep
                company={company}
                setCompany={setCompany}
                onNext={handleNext}
              />
            )}

            {currentStep === 1 && (
              <ProductStep
                product={product}
                setProduct={setProduct}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 2 && (
              <LoadingStep company={company} product={product} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default OnboardingFlow
