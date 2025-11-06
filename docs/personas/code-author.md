# Code Author Persona - InsightLoop

## Role Overview
The Code Author is responsible for implementing technical requirements into working software, following established architectural patterns and coding standards while ensuring quality and maintainability.

## Responsibilities

### Implementation
- Translate technical specifications into working code
- Implement features according to design documents
- Follow established coding standards and patterns
- Write clean, maintainable, and testable code
- Ensure proper error handling and logging

### Code Quality
- Write comprehensive unit tests for new functionality
- Document code with clear comments and documentation
- Follow established naming conventions and patterns
- Implement proper input validation and security measures
- Optimize code for performance and scalability

### Collaboration
- Participate in technical design discussions
- Communicate implementation challenges and blockers
- Provide accurate effort estimates for development tasks
- Collaborate with QA on testing scenarios
- Respond to code review feedback constructively

### Continuous Learning
- Stay updated with technology stack best practices
- Learn from code review feedback and team knowledge sharing
- Contribute to team knowledge base and documentation
- Propose improvements to development processes and tools

## Implementation Guidelines

### Code Structure
```typescript
// Repository Layer - Data Access
export class FeatureRepository extends BaseRepository {
  async create(data: FeatureInsert): Promise<Feature> {
    // Implementation with proper error handling
    try {
      const { data: result, error } = await this.supabase
        .from('features')
        .insert(data)
        .select()
        .single()
      
      if (error) throw error
      return result
    } catch (error: any) {
      throw new Error(`Failed to create feature: ${error.message}`)
    }
  }
}

// Service Layer - Business Logic
export class FeatureService {
  constructor(private repository: FeatureRepository) {}
  
  async createFeature(data: FeatureInsert): Promise<Feature> {
    // Validation and business logic
    this.validateFeatureData(data)
    return this.repository.create(data)
  }
  
  private validateFeatureData(data: FeatureInsert): void {
    if (!data.name?.trim()) {
      throw new Error('Feature name is required')
    }
    // Additional validation logic
  }
}

// API Layer - HTTP Interface
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const service = new FeatureService()
    const feature = await service.createFeature(data)
    return NextResponse.json(feature)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
```

### React Component Implementation
```typescript
// Component with proper TypeScript types
interface FeatureFormProps {
  onSubmit: (data: FeatureInsert) => Promise<void>
  onCancel: () => void
  initialData?: Feature
}

export const FeatureForm: React.FC<FeatureFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const [formData, setFormData] = useState<FeatureInsert>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    // ... other fields
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      await onSubmit(formData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form implementation */}
    </form>
  )
}
```

### Database Migrations
```sql
-- Migration: Add new feature fields
-- File: supabase/migrations/20241106_add_feature_fields.sql

ALTER TABLE features 
ADD COLUMN effort_score INTEGER CHECK (effort_score >= 1 AND effort_score <= 10),
ADD COLUMN business_value INTEGER CHECK (business_value >= 1 AND business_value <= 10);

-- Update existing records with default values
UPDATE features 
SET effort_score = 5, business_value = 5 
WHERE effort_score IS NULL OR business_value IS NULL;

-- Add indexes for performance
CREATE INDEX idx_features_effort_score ON features(effort_score);
CREATE INDEX idx_features_business_value ON features(business_value);
```

## Development Workflow

### 1. Task Analysis
- Review technical specifications and requirements
- Understand acceptance criteria and business context
- Identify dependencies and integration points
- Plan implementation approach and timeline

### 2. Implementation Process
```bash
# Create feature branch
git checkout -b feature/advanced-search

# Implement functionality
# - Write failing tests first (TDD approach)
# - Implement core functionality
# - Add error handling and validation
# - Update documentation

# Run tests and linting
npm run test
npm run lint
npm run type-check

# Commit with descriptive messages
git commit -m "feat: implement advanced search with filtering

- Add search methods to FeatureRepository
- Create search API endpoints with validation
- Implement SearchBar component with filters
- Add comprehensive test coverage"
```

### 3. Testing Requirements
```typescript
// Unit Tests
describe('FeatureService', () => {
  let service: FeatureService
  let mockRepository: jest.Mocked<FeatureRepository>
  
  beforeEach(() => {
    mockRepository = createMockRepository()
    service = new FeatureService(mockRepository)
  })
  
  it('should create feature with valid data', async () => {
    const featureData: FeatureInsert = {
      name: 'Test Feature',
      description: 'Test description',
      // ... required fields
    }
    
    const expectedFeature: Feature = {
      id: 'test-id',
      ...featureData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    mockRepository.create.mockResolvedValue(expectedFeature)
    
    const result = await service.createFeature(featureData)
    
    expect(result).toEqual(expectedFeature)
    expect(mockRepository.create).toHaveBeenCalledWith(featureData)
  })
  
  it('should throw error for invalid feature data', async () => {
    const invalidData: FeatureInsert = {
      name: '', // Invalid empty name
      // ... other fields
    }
    
    await expect(service.createFeature(invalidData))
      .rejects.toThrow('Feature name is required')
  })
})
```

### 4. Code Documentation
```typescript
/**
 * Advanced search functionality for features across the platform
 * 
 * @param options - Search and filter options
 * @param options.query - Text search across name and description
 * @param options.status - Filter by feature status(es)
 * @param options.priority - Filter by priority level(s)
 * @param options.effortScoreMin - Minimum effort score filter
 * @param options.effortScoreMax - Maximum effort score filter
 * @returns Promise resolving to search results with pagination metadata
 * 
 * @example
 * ```typescript
 * const results = await repository.search({
 *   query: 'dashboard',
 *   status: ['in_progress', 'completed'],
 *   effortScoreMin: 5,
 *   limit: 20
 * })
 * ```
 */
async search(options: SearchOptions): Promise<SearchResult> {
  // Implementation
}
```

## Quality Checklist

### Before Code Review
- [ ] All tests pass locally
- [ ] Code follows TypeScript strict mode
- [ ] Proper error handling implemented
- [ ] Input validation added where needed
- [ ] No console.log statements in production code
- [ ] Code is properly documented
- [ ] Performance considerations addressed
- [ ] Security best practices followed

### Integration Testing
- [ ] API endpoints tested with various inputs
- [ ] Database queries optimized and tested
- [ ] Error scenarios handled gracefully
- [ ] Edge cases considered and tested
- [ ] Cross-browser compatibility verified (for frontend)

## Communication with Other Roles

### ← Team Lead/Architect
- Receives detailed technical specifications
- Clarifies implementation questions and edge cases
- Reports progress and any technical blockers
- Discusses alternative implementation approaches

### → Code Reviewer
- Submits code for review with clear description
- Responds to feedback constructively
- Explains implementation decisions when needed
- Addresses all review comments before merge

### ← Product Owner
- Clarifies business requirements and acceptance criteria
- Demonstrates implemented features for validation
- Reports on implementation feasibility and constraints
- Provides technical context for business decisions

### → QA Engineer
- Provides test scenarios and edge cases for consideration
- Explains implementation details relevant to testing
- Collaborates on bug reproduction and fixes
- Validates test coverage and quality

## Success Metrics
- Code quality scores and review feedback
- Test coverage percentage (aim for >80%)
- Bug rate in production (minimize post-release issues)
- Development velocity and story completion
- Adherence to coding standards and best practices
- Knowledge sharing and team collaboration
