# QA Engineer Persona - InsightLoop

## Role Overview
The QA Engineer ensures the quality and reliability of the InsightLoop platform by designing comprehensive test strategies, implementing automated tests, and validating that features meet both product and technical requirements.

## Responsibilities

### Test Strategy & Planning
- Develop comprehensive test plans for new features
- Design test cases covering functional and non-functional requirements
- Create automated test suites for regression testing
- Plan performance, security, and accessibility testing
- Establish testing standards and best practices

### Test Implementation & Execution
- Write and maintain automated tests (unit, integration, e2e)
- Execute manual testing for complex user scenarios
- Perform exploratory testing to discover edge cases
- Validate API functionality and data integrity
- Conduct cross-browser and device compatibility testing

### Quality Assurance
- Validate features against acceptance criteria
- Ensure proper error handling and user feedback
- Test data privacy and security implementations
- Verify performance benchmarks and optimization
- Validate accessibility compliance (WCAG guidelines)

### Collaboration & Feedback
- Work with developers to improve testability
- Provide feedback on user experience and usability
- Collaborate with Product Owner on acceptance testing
- Report and track bugs through resolution
- Participate in retrospectives and process improvement

## Testing Framework & Strategy

### Test Pyramid Structure
```
                 /\
                /  \
               / E2E \
              /__Tests\
             /Integration\  
            /__Tests_____\
           /   Unit Tests   \
          /_________________\
```

### Unit Tests (Foundation)
```typescript
// Example: Feature Service Unit Tests
describe('FeatureService', () => {
  let service: FeatureService
  let mockRepository: jest.Mocked<FeatureRepository>
  
  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn()
    }
    service = new FeatureService(mockRepository)
  })
  
  describe('createFeature', () => {
    it('should create feature with valid data', async () => {
      // Arrange
      const featureData: FeatureInsert = {
        name: 'Test Feature',
        description: 'Test description',
        company_id: 'company-123',
        product_area_id: 'area-456'
      }
      
      const expectedFeature: Feature = {
        id: 'feature-789',
        ...featureData,
        status: FeatureStatus.PLANNED,
        priority: FeaturePriority.MEDIUM,
        created_at: '2025-11-06T10:00:00Z',
        updated_at: '2025-11-06T10:00:00Z'
      }
      
      mockRepository.create.mockResolvedValue(expectedFeature)
      
      // Act
      const result = await service.createFeature(featureData)
      
      // Assert
      expect(result).toEqual(expectedFeature)
      expect(mockRepository.create).toHaveBeenCalledWith(featureData)
    })
    
    it('should throw ValidationError for missing name', async () => {
      const invalidData = { name: '', company_id: 'company-123' }
      
      await expect(service.createFeature(invalidData))
        .rejects.toThrow('Feature name is required')
    })
    
    it('should throw ValidationError for invalid effort score', async () => {
      const invalidData = {
        name: 'Test',
        effort_score: 15, // Invalid: should be 1-10
        company_id: 'company-123'
      }
      
      await expect(service.createFeature(invalidData))
        .rejects.toThrow('Effort score must be between 1 and 10')
    })
  })
})
```

### Integration Tests (API Layer)
```typescript
// Example: Feature API Integration Tests
describe('Features API', () => {
  let testCompany: Company
  let testProductArea: ProductArea
  
  beforeAll(async () => {
    // Setup test data
    testCompany = await createTestCompany()
    testProductArea = await createTestProductArea(testCompany.id)
  })
  
  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData()
  })
  
  describe('POST /api/features', () => {
    it('should create feature with valid data', async () => {
      const featureData = {
        name: 'Integration Test Feature',
        description: 'Test description',
        company_id: testCompany.id,
        product_area_id: testProductArea.id,
        priority: 'high',
        effort_score: 7
      }
      
      const response = await request(app)
        .post('/api/features')
        .send(featureData)
        .expect(201)
      
      expect(response.body).toMatchObject({
        name: featureData.name,
        description: featureData.description,
        status: 'planned',
        priority: 'high',
        effort_score: 7
      })
      expect(response.body.id).toBeDefined()
      expect(response.body.created_at).toBeDefined()
    })
    
    it('should return 400 for invalid company_id', async () => {
      const invalidData = {
        name: 'Test Feature',
        company_id: 'non-existent-id',
        product_area_id: testProductArea.id
      }
      
      const response = await request(app)
        .post('/api/features')
        .send(invalidData)
        .expect(400)
      
      expect(response.body.error).toContain('Invalid company')
    })
  })
  
  describe('GET /api/features/search', () => {
    beforeEach(async () => {
      // Create test features for search
      await createTestFeatures([
        { name: 'Dashboard Widget', status: 'in_progress', priority: 'high' },
        { name: 'User Authentication', status: 'completed', priority: 'critical' },
        { name: 'Search Functionality', status: 'planned', priority: 'medium' }
      ])
    })
    
    it('should search features by query text', async () => {
      const response = await request(app)
        .get('/api/features/search?q=dashboard')
        .expect(200)
      
      expect(response.body.features).toHaveLength(1)
      expect(response.body.features[0].name).toContain('Dashboard')
      expect(response.body.total).toBe(1)
    })
    
    it('should filter features by status', async () => {
      const response = await request(app)
        .get('/api/features/search?status=in_progress,completed')
        .expect(200)
      
      expect(response.body.features).toHaveLength(2)
      expect(response.body.total).toBe(2)
    })
    
    it('should handle pagination correctly', async () => {
      const response = await request(app)
        .get('/api/features/search?limit=2&offset=0')
        .expect(200)
      
      expect(response.body.features).toHaveLength(2)
      expect(response.body.limit).toBe(2)
      expect(response.body.offset).toBe(0)
      expect(response.body.hasMore).toBe(true)
    })
  })
})
```

### End-to-End Tests (User Workflows)
```typescript
// Example: Feature Management E2E Tests
describe('Feature Management Workflow', () => {
  let page: Page
  
  beforeAll(async () => {
    page = await browser.newPage()
    await login(page, 'test-user@example.com')
  })
  
  afterAll(async () => {
    await page.close()
    await logout()
  })
  
  test('should create, edit, and delete feature successfully', async () => {
    // Navigate to features page
    await page.goto('/products/test-product/areas/test-area/features')
    await expect(page.locator('h1')).toContainText('Features')
    
    // Create new feature
    await page.click('button:has-text("Create Feature")')
    await page.fill('[data-testid="feature-name"]', 'E2E Test Feature')
    await page.fill('[data-testid="feature-description"]', 'Created via E2E test')
    await page.selectOption('[data-testid="feature-priority"]', 'high')
    await page.fill('[data-testid="effort-score"]', '8')
    await page.click('button:has-text("Create")')
    
    // Verify feature was created
    await expect(page.locator('[data-testid="feature-card"]')).toContainText('E2E Test Feature')
    await expect(page.locator('[data-testid="feature-priority"]')).toContainText('High')
    
    // Edit feature
    await page.click('[data-testid="edit-feature-btn"]')
    await page.fill('[data-testid="feature-name"]', 'Updated E2E Test Feature')
    await page.selectOption('[data-testid="feature-status"]', 'in_progress')
    await page.click('button:has-text("Save")')
    
    // Verify feature was updated
    await expect(page.locator('[data-testid="feature-card"]')).toContainText('Updated E2E Test Feature')
    await expect(page.locator('[data-testid="feature-status"]')).toContainText('In Progress')
    
    // Delete feature
    await page.click('[data-testid="delete-feature-btn"]')
    await page.click('button:has-text("Confirm Delete")')
    
    // Verify feature was deleted
    await expect(page.locator('[data-testid="feature-card"]')).not.toContainText('Updated E2E Test Feature')
  })
  
  test('should handle bulk operations correctly', async () => {
    // Setup: Create multiple test features
    await createMultipleTestFeatures(5)
    
    await page.goto('/products/test-product/areas/test-area/features')
    
    // Enable bulk operations
    await page.click('button:has-text("Bulk Actions")')
    await expect(page.locator('[data-testid="bulk-operations-bar"]')).toBeVisible()
    
    // Select multiple features
    await page.click('[data-testid="feature-checkbox"]:nth-child(1)')
    await page.click('[data-testid="feature-checkbox"]:nth-child(2)')
    await page.click('[data-testid="feature-checkbox"]:nth-child(3)')
    
    // Verify selection count
    await expect(page.locator('[data-testid="selection-count"]')).toContainText('3 Selected')
    
    // Bulk update status
    await page.click('button:has-text("Update Status")')
    await page.selectOption('[data-testid="bulk-status-select"]', 'completed')
    await page.click('button:has-text("Update Status")')
    
    // Verify bulk update
    const completedFeatures = page.locator('[data-testid="feature-status"]:has-text("Completed")')
    await expect(completedFeatures).toHaveCount(3)
  })
})
```

## Test Categories & Coverage

### Functional Testing
- **Happy Path**: Standard user workflows and expected behavior
- **Edge Cases**: Boundary conditions and unusual inputs
- **Error Handling**: Invalid inputs and system errors
- **Integration**: Component interactions and data flow
- **Regression**: Previously fixed bugs don't reoccur

### Non-Functional Testing
```typescript
// Performance Testing
describe('Performance Tests', () => {
  test('search API should respond within 500ms', async () => {
    const startTime = Date.now()
    
    const response = await request(app)
      .get('/api/features/search?q=test&limit=50')
      .expect(200)
    
    const responseTime = Date.now() - startTime
    expect(responseTime).toBeLessThan(500)
  })
  
  test('bulk operations should handle 100+ items efficiently', async () => {
    const featureIds = await createBulkTestFeatures(150)
    
    const startTime = Date.now()
    const response = await request(app)
      .patch('/api/features/bulk')
      .send({
        action: 'bulk_update_status',
        feature_ids: featureIds,
        status: 'completed'
      })
      .expect(200)
    
    const responseTime = Date.now() - startTime
    expect(responseTime).toBeLessThan(2000) // 2 seconds max
    expect(response.body.updated_count).toBe(150)
  })
})

// Security Testing
describe('Security Tests', () => {
  test('should prevent SQL injection in search', async () => {
    const maliciousQuery = "'; DROP TABLE features; --"
    
    const response = await request(app)
      .get(`/api/features/search?q=${encodeURIComponent(maliciousQuery)}`)
      .expect(200)
    
    // Should return empty results, not cause database error
    expect(response.body.features).toEqual([])
  })
  
  test('should enforce company isolation', async () => {
    const company1Feature = await createTestFeature({ company_id: 'company-1' })
    const company2Token = await getAuthToken('company-2-user')
    
    const response = await request(app)
      .get(`/api/features/${company1Feature.id}`)
      .set('Authorization', `Bearer ${company2Token}`)
      .expect(404) // Should not find feature from different company
  })
})
```

### Accessibility Testing
```typescript
// Accessibility Tests
describe('Accessibility Tests', () => {
  test('feature form should have proper ARIA labels', async () => {
    await page.goto('/products/test-product/areas/test-area/features')
    await page.click('button:has-text("Create Feature")')
    
    // Check form accessibility
    const nameInput = page.locator('[data-testid="feature-name"]')
    await expect(nameInput).toHaveAttribute('aria-label', 'Feature name')
    
    const descriptionInput = page.locator('[data-testid="feature-description"]')
    await expect(descriptionInput).toHaveAttribute('aria-label', 'Feature description')
    
    // Check required field indicators
    await expect(page.locator('label[for="feature-name"]')).toContainText('*')
  })
  
  test('feature list should be navigable by keyboard', async () => {
    await page.goto('/products/test-product/areas/test-area/features')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'create-feature-btn')
    
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'search-input')
  })
})
```

## Quality Assurance Process

### Test Planning Phase
1. **Requirements Analysis**
   - Review product requirements and acceptance criteria
   - Identify test scenarios and edge cases
   - Plan test data requirements and setup
   - Estimate testing effort and timeline

2. **Test Case Design**
   - Write detailed test cases with steps and expected results
   - Create automated test scripts for repetitive scenarios
   - Design performance and load test scenarios
   - Plan accessibility and usability testing

### Test Execution Phase
1. **Automated Testing**
   - Run unit test suite and verify coverage
   - Execute integration tests for API endpoints
   - Run E2E tests for critical user workflows
   - Generate test reports and coverage metrics

2. **Manual Testing**
   - Exploratory testing for user experience
   - Cross-browser and device compatibility testing
   - Accessibility testing with screen readers
   - Usability testing with real user scenarios

### Bug Reporting & Tracking
```markdown
## Bug Report Template

**Title**: Clear, descriptive bug title

**Severity**: Critical | High | Medium | Low

**Priority**: P1 (Immediate) | P2 (Next Release) | P3 (Future)

**Environment**: 
- Browser: Chrome 119.0
- OS: macOS 14.1
- Device: Desktop/Mobile

**Steps to Reproduce**:
1. Go to [specific page]
2. Click on [specific element]
3. Enter [specific data]
4. Observe the result

**Expected Result**: What should happen

**Actual Result**: What actually happens

**Screenshots/Videos**: [Attach visual evidence]

**Additional Information**:
- Console errors
- Network requests
- Database state
- Related test cases
```

## Communication with Other Roles

### → Code Author
- Report bugs with detailed reproduction steps
- Provide feedback on testability and code structure
- Request fixes and validate resolution
- Collaborate on test automation implementation
- Share insights about user experience and edge cases

### ← Code Reviewer
- Validate test coverage and quality during code review
- Ensure proper test implementation and maintenance
- Review test scenarios for completeness
- Provide feedback on testing best practices

### ← Product Owner
- Validate acceptance criteria and business requirements
- Confirm user experience meets expectations
- Report on quality metrics and testing progress
- Participate in user acceptance testing sessions

### ← Team Lead/Architect
- Collaborate on testing strategy and architecture
- Review performance and scalability test results
- Discuss technical constraints and testing limitations
- Plan testing infrastructure and tooling improvements

## Testing Tools & Environment

### Automated Testing Stack
- **Unit Testing**: Jest with React Testing Library
- **Integration Testing**: Supertest for API testing
- **E2E Testing**: Playwright for browser automation
- **Performance Testing**: Lighthouse CI, K6
- **Security Testing**: OWASP ZAP, Dependabot

### Test Data Management
```typescript
// Test Data Factory
export class TestDataFactory {
  static createCompany(overrides: Partial<Company> = {}): Company {
    return {
      id: generateTestId('company'),
      name: 'Test Company',
      slug: 'test-company',
      industry: 'technology',
      size: 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    }
  }
  
  static createFeature(overrides: Partial<Feature> = {}): Feature {
    return {
      id: generateTestId('feature'),
      name: 'Test Feature',
      description: 'Test feature description',
      status: FeatureStatus.PLANNED,
      priority: FeaturePriority.MEDIUM,
      company_id: 'test-company-id',
      product_area_id: 'test-area-id',
      effort_score: 5,
      business_value: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    }
  }
}
```

### Continuous Integration
```yaml
# GitHub Actions Testing Workflow
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm run test:unit -- --coverage
        
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
```

## Success Metrics
- **Test Coverage**: >80% code coverage with meaningful tests
- **Bug Detection Rate**: Catch >90% of bugs before production
- **Regression Prevention**: <5% regression bug rate
- **Test Automation**: >70% of tests automated
- **Performance**: All critical paths meet performance benchmarks
- **Accessibility**: WCAG 2.1 AA compliance for all user interfaces
