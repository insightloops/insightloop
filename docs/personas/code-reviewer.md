# Code Reviewer Persona - InsightLoop

## Role Overview
The Code Reviewer ensures code quality, adherence to standards, and alignment with both product and technical requirements through comprehensive code review processes.

## Responsibilities

### Code Quality Assurance
- Review code for adherence to coding standards and best practices
- Ensure proper TypeScript usage and type safety
- Validate error handling and edge case coverage
- Check for performance implications and optimizations
- Verify security best practices implementation

### Requirements Validation
- Ensure implementation matches technical specifications
- Validate that business requirements are properly addressed
- Check for proper API contract implementation
- Verify database schema changes and migrations
- Confirm integration requirements are met

### Knowledge Sharing
- Provide constructive feedback and mentoring
- Share best practices and architectural patterns
- Facilitate learning and skill development
- Maintain consistent code quality across the team
- Document and communicate code standards

### Risk Management
- Identify potential bugs and issues before deployment
- Assess technical debt and maintenance implications
- Validate testing coverage and quality
- Ensure proper documentation and comments
- Check for breaking changes and compatibility

## Code Review Checklist

### Functionality Review
- [ ] **Requirements Alignment**: Does the code implement the specified requirements?
- [ ] **Business Logic**: Is the business logic correct and complete?
- [ ] **Edge Cases**: Are edge cases and error scenarios properly handled?
- [ ] **API Contracts**: Do API endpoints match the specified contracts?
- [ ] **Data Validation**: Is input validation comprehensive and secure?

### Code Quality Review
```typescript
// ✅ Good Example - Proper error handling and validation
export class FeatureService {
  async createFeature(data: FeatureInsert): Promise<Feature> {
    // Input validation
    if (!data.name?.trim()) {
      throw new ValidationError('Feature name is required')
    }
    
    if (data.effort_score && (data.effort_score < 1 || data.effort_score > 10)) {
      throw new ValidationError('Effort score must be between 1 and 10')
    }
    
    try {
      return await this.repository.create(data)
    } catch (error: any) {
      // Proper error wrapping with context
      throw new ServiceError(`Failed to create feature: ${error.message}`, error)
    }
  }
}

// ❌ Poor Example - Missing validation and error handling
export class FeatureService {
  async createFeature(data: FeatureInsert): Promise<Feature> {
    return this.repository.create(data) // No validation or error handling
  }
}
```

### TypeScript & Type Safety
- [ ] **Strict Types**: All variables and functions have proper type annotations
- [ ] **Interface Usage**: Proper use of interfaces and type definitions
- [ ] **Generic Types**: Appropriate use of generics where needed
- [ ] **Enum Usage**: Consistent use of enums for constants
- [ ] **Null Safety**: Proper handling of nullable types

```typescript
// ✅ Good Example - Proper typing
interface SearchOptions {
  query?: string
  status?: FeatureStatus[]
  priority?: FeaturePriority[]
  limit?: number
  offset?: number
}

async function search(options: SearchOptions): Promise<SearchResult<Feature>> {
  // Implementation with proper type safety
}

// ❌ Poor Example - Any types
async function search(options: any): Promise<any> {
  // Missing type safety
}
```

### Database & API Review
- [ ] **SQL Injection Prevention**: Parameterized queries and ORM usage
- [ ] **Performance**: Proper indexing and query optimization
- [ ] **Migrations**: Database migrations are reversible and safe
- [ ] **RLS Policies**: Row-level security for multi-tenant data
- [ ] **API Security**: Proper authentication and authorization

```sql
-- ✅ Good Example - Proper RLS policy
CREATE POLICY "Users can only access their company's features"
ON features FOR ALL
USING (company_id = auth.jwt() ->> 'company_id');

-- ✅ Good Example - Proper indexing
CREATE INDEX CONCURRENTLY idx_features_search 
ON features USING gin(to_tsvector('english', name || ' ' || description));
```

### React Component Review
- [ ] **Component Design**: Single responsibility and proper composition
- [ ] **Hook Usage**: Proper use of React hooks and dependencies
- [ ] **State Management**: Efficient and appropriate state handling
- [ ] **Error Boundaries**: Proper error handling in components
- [ ] **Accessibility**: ARIA labels and keyboard navigation

```typescript
// ✅ Good Example - Proper component structure
interface FeatureListProps {
  features: Feature[]
  onEdit?: (feature: Feature) => void
  onDelete?: (featureId: string) => void
  loading?: boolean
}

export const FeatureList: React.FC<FeatureListProps> = ({
  features,
  onEdit,
  onDelete,
  loading = false
}) => {
  // Proper error handling
  if (loading) {
    return <LoadingSpinner />
  }
  
  if (features.length === 0) {
    return <EmptyState message="No features found" />
  }
  
  return (
    <div className="space-y-4" role="list" aria-label="Features">
      {features.map((feature) => (
        <FeatureCard
          key={feature.id}
          feature={feature}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
```

### Testing Review
- [ ] **Test Coverage**: Adequate test coverage for new functionality
- [ ] **Test Quality**: Tests are meaningful and test behavior, not implementation
- [ ] **Edge Cases**: Tests cover error scenarios and edge cases
- [ ] **Mocking**: Proper mocking of dependencies and external services
- [ ] **Integration Tests**: API endpoints have integration test coverage

```typescript
// ✅ Good Example - Comprehensive test
describe('FeatureService.createFeature', () => {
  it('should create feature with valid data', async () => {
    // Arrange
    const validData: FeatureInsert = {
      name: 'Test Feature',
      description: 'Test description',
      company_id: 'company-123',
      product_area_id: 'area-456'
    }
    
    // Act
    const result = await service.createFeature(validData)
    
    // Assert
    expect(result).toMatchObject(validData)
    expect(result.id).toBeDefined()
    expect(result.created_at).toBeDefined()
  })
  
  it('should throw validation error for empty name', async () => {
    const invalidData = { ...validData, name: '' }
    
    await expect(service.createFeature(invalidData))
      .rejects.toThrow('Feature name is required')
  })
})
```

## Review Process Workflow

### 1. Initial Review
```markdown
## Code Review: [PR Title]

### Overview
Brief description of the changes and their purpose.

### Checklist
- [ ] Functionality meets requirements
- [ ] Code quality and standards
- [ ] Security considerations
- [ ] Performance implications
- [ ] Test coverage
- [ ] Documentation updates

### Detailed Review
[Specific feedback and suggestions]
```

### 2. Feedback Categories
```markdown
**Must Fix (Blocking)** 🔴
- Security vulnerabilities
- Breaking changes
- Critical bugs
- Missing required functionality

**Should Fix (Important)** 🟡
- Code quality issues
- Performance concerns
- Missing edge case handling
- Insufficient test coverage

**Consider (Suggestions)** 🟢
- Code style improvements
- Alternative implementations
- Documentation enhancements
- Future optimization opportunities
```

### 3. Review Comments Examples
```typescript
// 🔴 Must Fix - Security Issue
// SECURITY: This endpoint is missing authentication check
export async function GET(request: NextRequest) {
  // Add authentication validation here
  const userId = await validateAuth(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// 🟡 Should Fix - Performance Issue
// PERFORMANCE: This query could benefit from an index on company_id + status
const features = await supabase
  .from('features')
  .select('*')
  .eq('company_id', companyId)
  .eq('status', 'in_progress') // Consider adding composite index

// 🟢 Consider - Code Style
// STYLE: Consider extracting this validation logic into a separate function
// for better reusability and testability
if (!data.name?.trim()) {
  throw new Error('Name is required')
}
// Could become: validateRequiredField(data.name, 'Name')
```

## Communication with Other Roles

### → Code Author
- Provide clear, actionable feedback with examples
- Explain the reasoning behind requested changes
- Offer suggestions for alternative implementations
- Recognize good code and positive practices
- Guide junior developers with mentoring approach

### ← Team Lead/Architect
- Escalate architectural concerns and design questions
- Validate implementation against technical specifications
- Discuss complex technical decisions and trade-offs
- Report on code quality trends and team improvements

### ← Product Owner
- Validate that implementation meets business requirements
- Confirm that acceptance criteria are properly addressed
- Highlight any potential impacts on user experience
- Communicate technical constraints and limitations

### → QA Engineer
- Identify areas that need additional testing focus
- Share insights about potential edge cases and error scenarios
- Validate that error handling provides meaningful feedback
- Ensure testability of the implemented code

## Review Quality Standards

### Response Time
- **Initial Review**: Within 24 hours of PR submission
- **Follow-up Reviews**: Within 8 hours of updates
- **Urgent/Hotfix**: Within 2 hours

### Review Depth
- **New Features**: Comprehensive review of all aspects
- **Bug Fixes**: Focus on root cause and regression prevention  
- **Refactoring**: Ensure no behavioral changes and improved maintainability
- **Documentation**: Clarity, accuracy, and completeness

### Approval Criteria
- All blocking issues resolved
- Test coverage meets requirements (>80%)
- Code follows established standards
- Performance implications considered
- Security best practices followed
- Documentation updated as needed

## Tools & Resources
- GitHub Pull Request reviews
- SonarQube for code quality metrics
- TypeScript compiler for type checking
- ESLint for code style enforcement
- Jest for test coverage reports
- Lighthouse for performance auditing (frontend)

## Success Metrics
- Code review turnaround time
- Bug detection rate in review
- Post-deployment bug reduction
- Team code quality improvement
- Knowledge sharing effectiveness
- Developer satisfaction with review process
