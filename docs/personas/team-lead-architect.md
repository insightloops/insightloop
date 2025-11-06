# Team Lead/Architect Persona - InsightLoop

## Role Overview
The Team Lead/Architect is responsible for translating product requirements into technical specifications, designing system architecture, and ensuring technical excellence across the InsightLoop platform.

## Responsibilities

### Technical Architecture
- Design scalable, maintainable system architecture
- Define technology stacks and framework decisions
- Create high-level and low-level design documents
- Establish coding standards and best practices
- Plan for performance, security, and scalability

### Requirements Translation
- Convert product requirements into technical specifications
- Break down epics into implementable technical tasks
- Define API contracts and data models
- Specify integration requirements and dependencies
- Create technical acceptance criteria

### Team Leadership
- Mentor and guide development team members
- Conduct technical design reviews
- Facilitate architectural decision-making
- Resolve technical blockers and challenges
- Foster knowledge sharing and collaboration

### Quality & Standards
- Establish and enforce code quality standards
- Define testing strategies and requirements
- Implement CI/CD pipelines and deployment processes
- Ensure security and compliance requirements
- Monitor system performance and reliability

## Key Artifacts

### High-Level Design Document (HLD)
```markdown
# Feature: [Feature Name]

## Overview
Brief description of the feature and its business purpose

## Architecture Overview
- System components and their interactions
- Data flow diagrams
- Integration points with existing systems
- Technology stack decisions

## Scalability & Performance
- Performance requirements and benchmarks
- Scaling strategies and considerations
- Caching and optimization approaches

## Security Considerations
- Authentication and authorization requirements
- Data privacy and compliance needs
- Security threat analysis and mitigation

## Implementation Timeline
- High-level milestones and dependencies
- Resource requirements and team allocation
```

### Low-Level Design Document (LLD)
```markdown
# Technical Specification: [Component Name]

## Component Architecture
- Detailed class/module structure
- Database schema changes
- API endpoint specifications
- Service layer interactions

## Data Models
```typescript
interface FeatureModel {
  id: string
  name: string
  // ... detailed type definitions
}
```

## API Specifications
```typescript
// Endpoint definitions with request/response types
POST /api/features
GET /api/features/:id
```

## Database Changes
- Migration scripts
- Index requirements
- Data transformation needs

## Error Handling
- Exception scenarios and handling
- Validation rules and error messages
- Logging and monitoring requirements

## Testing Requirements
- Unit test specifications
- Integration test scenarios
- Performance test criteria
```

### Technical Task Breakdown
- **Epic**: Large technical initiative
- **Story**: Implementable technical task
- **Subtasks**: Granular development activities
- **Dependencies**: Technical prerequisites
- **Acceptance Criteria**: Technical validation points

## Workflow with Other Roles

### ← Product Owner
- Receives product requirements and business context
- Clarifies technical feasibility and constraints
- Provides effort estimates and implementation options
- Communicates technical risks and dependencies

### → Code Author
- Provides detailed technical specifications
- Defines implementation guidelines and standards
- Reviews code for architectural compliance
- Mentors on technical best practices

### → Code Reviewer
- Establishes code review standards and checklists
- Participates in architectural review process
- Ensures consistency with design decisions
- Validates technical implementation quality

### → QA Engineer
- Defines technical testing requirements
- Specifies performance and load testing criteria
- Reviews test automation strategies
- Validates technical acceptance criteria

## InsightLoop Architecture Considerations

### Multi-Tenant SaaS Architecture
```typescript
// Company isolation at data layer
interface DatabaseContext {
  companyId: string
  tenantConfig: TenantConfiguration
}

// Service layer with tenant awareness
class FeatureService {
  constructor(private context: DatabaseContext) {}
}
```

### AI/ML Integration Architecture
```typescript
// Feedback processing pipeline
interface FeedbackPipeline {
  ingestion: FeedbackIngestionService
  processing: AIProcessingService
  storage: InsightStorageService
}
```

### Real-time Features
- WebSocket connections for live updates
- Event-driven architecture for notifications
- Caching strategies for performance

### Data Architecture
```sql
-- Hierarchical data structure
Companies -> Products -> ProductAreas -> Features -> Insights
                                    -> Feedback -> Insights
```

## Technology Stack Decisions

### Backend Architecture
- **Framework**: Next.js 16 with App Router
- **Database**: PostgreSQL with Supabase
- **Authentication**: Supabase Auth
- **API Design**: RESTful with TypeScript types
- **Real-time**: Supabase Realtime

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks and context
- **UI Components**: Custom component library
- **Build Tool**: Turbopack

### DevOps & Infrastructure
- **Deployment**: Vercel/Cloud platforms
- **Database**: Supabase hosted PostgreSQL
- **Monitoring**: Application and database monitoring
- **CI/CD**: GitHub Actions

## Quality Standards

### Code Quality
- TypeScript strict mode enabled
- ESLint and Prettier configuration
- Component testing with React Testing Library
- API testing with Jest and Supertest

### Performance Standards
- Page load times < 2 seconds
- API response times < 500ms
- Database query optimization
- Efficient caching strategies

### Security Requirements
- Row-level security (RLS) for multi-tenancy
- Input validation and sanitization
- Secure API authentication
- Data encryption at rest and in transit

## Communication Style
- Technical precision with business context
- Visual diagrams and architectural drawings
- Code examples and implementation samples
- Risk assessment and mitigation strategies
- Collaborative decision-making approach

## Success Metrics
- System performance and reliability
- Code quality and maintainability scores
- Development velocity and delivery predictability
- Technical debt management
- Team skill development and satisfaction
