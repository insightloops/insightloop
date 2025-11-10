# User Linking Documentation

## Overview

This document describes the user linking strategy implemented across all entities in the InsightLoop database schema. Every entity now has user references to track ownership, creation, and assignment.

## User ID Patterns

### Primary Ownership Pattern
Most entities follow this pattern:
- `user_id`: Primary owner/responsible person for the entity
- `created_by_user_id`: User who created the record (may differ from owner)

### Extended Assignment Pattern
Some entities include additional assignment fields:
- `assigned_to_user_id`: User assigned to work on or achieve the objective/feature

### Processing Pattern
Feedback items include:
- `user_id`: End user who provided the feedback
- `processed_by_user_id`: Internal user who processed/categorized the feedback

### Review Pattern
Insights include:
- `reviewed_by_user_id`: User who reviewed/approved the insight

## Entity-Specific User Relationships

### Companies
- `user_id`: Company owner/admin
- `created_by_user_id`: User who created the company record

**Use Cases:**
- Multi-tenant access control
- Company administration permissions
- Audit trail of company creation

### Products
- `user_id`: Product owner/manager
- `created_by_user_id`: User who created the product

**Use Cases:**
- Product management permissions
- Product-level access control
- Feature assignment workflows

### Product Areas
- `user_id`: Area owner/responsible person
- `created_by_user_id`: User who created the product area

**Use Cases:**
- Area-specific feature filtering
- Responsibility assignment
- Performance tracking by area owner

### Objectives/OKRs
- `user_id`: Primary objective owner
- `created_by_user_id`: User who created the objective
- `assigned_to_user_id`: User assigned to achieve the objective

**Use Cases:**
- OKR assignment and tracking
- Performance evaluation
- Goal-setting workflows

### Features
- `user_id`: Feature owner/product manager
- `created_by_user_id`: User who created the feature
- `assigned_to_user_id`: User assigned to implement the feature

**Use Cases:**
- Development assignment
- Feature ownership tracking
- Sprint planning and assignment
- Developer workload management

### Feedback Items
- `user_id`: End user who provided the feedback
- `processed_by_user_id`: Internal user who processed/categorized the feedback

**Use Cases:**
- Customer feedback attribution
- Support ticket routing
- Feedback processing workflows
- Customer segmentation analysis

### Insights
- `user_id`: Insight owner/analyst
- `created_by_user_id`: User who created the insight
- `reviewed_by_user_id`: User who reviewed/approved the insight

**Use Cases:**
- Insight ownership and accountability
- Review and approval workflows
- Quality control processes
- Analyst performance tracking

### Junction Tables
All junction tables include:
- `created_by_user_id`: User who created the relationship link

**Use Cases:**
- Audit trail of relationship creation
- Data quality tracking
- Link validation workflows

## Query Patterns

### User-Specific Data Access
```sql
-- Get all companies for a user
SELECT * FROM companies WHERE user_id = $1;

-- Get user's assigned features
SELECT f.*, pa.name as product_area_name 
FROM features f
JOIN product_areas pa ON f.product_area_id = pa.id
WHERE f.assigned_to_user_id = $1;

-- Get feedback processed by user
SELECT * FROM feedback_items WHERE processed_by_user_id = $1;
```

### Multi-User Collaboration Queries
```sql
-- Get features created by one user but assigned to another
SELECT f.*, u1.name as creator, u2.name as assignee
FROM features f
JOIN users u1 ON f.created_by_user_id = u1.id
JOIN users u2 ON f.assigned_to_user_id = u2.id
WHERE f.created_by_user_id != f.assigned_to_user_id;
```

### Audit Trail Queries
```sql
-- Track user activity across all entities
SELECT 'company' as entity_type, name, created_at 
FROM companies WHERE created_by_user_id = $1
UNION ALL
SELECT 'feature' as entity_type, name, created_at 
FROM features WHERE created_by_user_id = $1
ORDER BY created_at DESC;
```

## Security Considerations

### Row Level Security (RLS)
When implementing RLS policies, consider:
- Users should see data from their companies
- Users should see entities they own or are assigned to
- Admin users may need broader access

Example RLS policy:
```sql
-- Features access policy
CREATE POLICY features_access ON features
FOR ALL TO authenticated
USING (
  user_id = auth.uid() OR 
  created_by_user_id = auth.uid() OR 
  assigned_to_user_id = auth.uid() OR
  company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  )
);
```

### API Security
- Always filter by user context in API endpoints
- Validate user permissions before allowing modifications
- Log user actions for audit purposes

## Performance Considerations

### Indexes
The migration includes comprehensive indexes for user-based queries:
- Single-column indexes on all user_id fields
- Composite indexes for common query patterns
- Specialized indexes for filtering and sorting

### Query Optimization
- Use user-specific filtering early in query execution
- Consider user context when designing aggregation queries
- Implement pagination for user-specific lists

## Migration Strategy

### Data Migration
The migration adds nullable user columns to allow gradual population:
1. Add columns as NULL initially
2. Populate with seed data for development
3. In production, backfill user data based on business rules
4. Consider making columns NOT NULL after population

### Application Updates
1. Update all repository methods to include user context
2. Modify API endpoints to filter by user permissions
3. Update UI components to show user-specific data
4. Implement user assignment workflows

## Sample User IDs

For development and testing, the seed data uses these sample user patterns:
- `11111111-1111-1111-1111-111111111111`: Company admin/creator
- `22222222-2222-2222-2222-222222222222`: Product manager
- `33333333-3333-3333-3333-333333333333`: Mobile product manager
- `44444444-4444-4444-4444-444444444444`: Frontend developer
- `55555555-5555-5555-5555-555555555555`: Backend developer
- `99999999-9999-9999-9999-999999999999`: Samba company owner

These IDs help simulate different user roles and scenarios during development.
