# Company, Product, Product Area & Features - High-Level Design

## Overview
This document defines the foundational hierarchy for organizing business entities, products, features, and their relationships. This forms the core structure before any feedback processing occurs.

## Entity Hierarchy

```
Company (Root)
  └── Products (Many)
      └── Product Areas (Many)
          └── Features (Many)
```

## Core Philosophy
**Minimal Schema**: Keep entity schemas lean and flexible. Use JSONB metadata fields for company-specific customizations without rigid schema changes.

---

## 1. Entity Definitions

### 1.1 Company
**Purpose**: Multi-tenant root entity representing a business or organization

**Minimal Schema**:
```typescript
interface Company {
  id: string                    // UUID
  name: string                  // Company name
  slug: string                  // URL-friendly identifier (unique)
  created_at: Date
  updated_at: Date
}
```

**Optional Fields** (can be added via metadata):
- Industry, company size, website, logo, etc.

**Why Minimal?**: Every company is different. Core identification only.

---

### 1.2 Product
**Purpose**: A product or service that the company offers and receives feedback on

**Minimal Schema**:
```typescript
interface Product {
  id: string                    // UUID
  company_id: string            // FK to Company
  name: string                  // Product name
  description?: string          // Brief description
  metadata: Record<string, any> // Flexible additional data
  created_at: Date
  updated_at: Date
}
```

**Examples**:
- Mobile App
- Web Platform
- API Service
- Enterprise Dashboard

**Relationships**:
- Belongs to one Company
- Has many Product Areas
- Has many Features (through Product Areas)

---

### 1.3 Product Area
**Purpose**: Major functional areas or modules within a product

**Minimal Schema**:
```typescript
interface ProductArea {
  id: string                    // UUID
  product_id: string            // FK to Product
  name: string                  // Area name
  description?: string          // What this area covers
  keywords: string[]            // Keywords for auto-tagging feedback
  parent_area_id?: string       // FK to ProductArea (for hierarchy)
  metadata: Record<string, any> // Flexible additional data
  created_at: Date
  updated_at: Date
}
```

**Examples**:
- "Onboarding" - User signup and initial setup
- "Billing" - Payment and subscription management
- "Dashboard" - Main user interface
- "API" - Developer API and integrations
- "Mobile App" - Mobile-specific features

**Relationships**:
- Belongs to one Product
- Has many Features
- Can have child Product Areas (hierarchy)
- Can have parent Product Area (hierarchy)

**Hierarchy Support**:
```
Dashboard
  ├── Analytics
  ├── Settings
  └── User Management
```

---

### 1.4 Feature
**Purpose**: Specific features or capabilities within a product area

**Minimal Schema**:
```typescript
interface Feature {
  id: string                    // UUID
  product_area_id: string       // FK to Product Area
  company_id: string            // FK to Company (for easy querying)
  name: string                  // Feature name
  description?: string          // What this feature does
  status: FeatureStatus         // Current development status
  priority: FeaturePriority     // Business priority
  metadata: Record<string, any> // Flexible additional data
  created_at: Date
  updated_at: Date
}

enum FeatureStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled'
}

enum FeaturePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}
```

**Examples**:
- "Single Sign-On" (in Authentication area)
- "Export to CSV" (in Dashboard area)
- "Recurring Billing" (in Billing area)
- "Dark Mode" (in Settings area)

**Relationships**:
- Belongs to one Product Area
- Belongs to one Company (denormalized for performance)
- Can be linked to Insights (future)
- Can be linked to Feedback (future)

---

## 2. Database Schema

### 2.1 Tables

```sql
-- Companies (already exists)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products (enhance existing)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Product Areas (already created in Phase 0)
CREATE TABLE product_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  keywords TEXT[] DEFAULT '{}',
  parent_area_id UUID REFERENCES product_areas(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, name)
);

-- Features (enhance existing)
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_area_id UUID NOT NULL REFERENCES product_areas(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'on_hold', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_product_areas_product ON product_areas(product_id);
CREATE INDEX idx_product_areas_parent ON product_areas(parent_area_id);
CREATE INDEX idx_features_area ON features(product_area_id);
CREATE INDEX idx_features_company ON features(company_id);
CREATE INDEX idx_features_status ON features(status);
CREATE INDEX idx_features_priority ON features(priority);
```

---

## 3. API Routes

### 3.1 Company Routes

```typescript
// Base path: /api/companies

GET    /api/companies                        // List all companies
POST   /api/companies                        // Create company
GET    /api/companies/:companyId            // Get company details
PATCH  /api/companies/:companyId            // Update company
DELETE /api/companies/:companyId            // Delete company
```

### 3.2 Product Routes

```typescript
// Base path: /api/companies/:companyId/products

GET    /api/companies/:companyId/products                    // List products
POST   /api/companies/:companyId/products                    // Create product
GET    /api/companies/:companyId/products/:productId        // Get product details
PATCH  /api/companies/:companyId/products/:productId        // Update product
DELETE /api/companies/:companyId/products/:productId        // Delete product

// With related data
GET    /api/companies/:companyId/products?include_areas=true  // Include product areas
```

### 3.3 Product Area Routes

```typescript
// Base path: /api/companies/:companyId/products/:productId/areas

GET    /api/companies/:companyId/products/:productId/areas                    // List all areas
POST   /api/companies/:companyId/products/:productId/areas                    // Create area
GET    /api/companies/:companyId/products/:productId/areas/:areaId           // Get area details
PATCH  /api/companies/:companyId/products/:productId/areas/:areaId           // Update area
DELETE /api/companies/:companyId/products/:productId/areas/:areaId           // Delete area

// Special endpoints
GET    /api/companies/:companyId/products/:productId/areas?top_level=true    // Top-level areas only
POST   /api/companies/:companyId/products/:productId/areas/discover          // AI-discover areas from feedback
GET    /api/companies/:companyId/products/:productId/areas/:areaId/hierarchy // Get with parent/children
```

### 3.4 Feature Routes

```typescript
// Base path: /api/companies/:companyId/products/:productId/areas/:areaId/features

GET    /api/companies/:companyId/products/:productId/areas/:areaId/features              // List features
POST   /api/companies/:companyId/products/:productId/areas/:areaId/features              // Create feature
GET    /api/companies/:companyId/products/:productId/areas/:areaId/features/:featureId  // Get feature
PATCH  /api/companies/:companyId/products/:productId/areas/:areaId/features/:featureId  // Update feature
DELETE /api/companies/:companyId/products/:productId/areas/:areaId/features/:featureId  // Delete feature

// Alternative flat routes for convenience
GET    /api/companies/:companyId/features                      // All features across all products
GET    /api/companies/:companyId/features?status=planned       // Filter by status
GET    /api/companies/:companyId/features?priority=high        // Filter by priority
```

---

## 4. UI Pages & Routes

### 4.1 Company Management

```
/dashboard                              → Company dashboard (list products)
/settings                               → Company settings
```

### 4.2 Product Management

```
/products                               → List all products
/products/new                           → Create new product
/products/:productId                    → Product overview
/products/:productId/edit              → Edit product details
```

### 4.3 Product Area Management

```
/products/:productId/areas                           → List product areas
/products/:productId/areas/new                       → Create new area
/products/:productId/areas/discover                  → AI-discover areas
/products/:productId/areas/:areaId                   → Area overview (with features)
/products/:productId/areas/:areaId/edit             → Edit area details
```

### 4.4 Feature Management

```
/products/:productId/areas/:areaId/features          → List features for area
/products/:productId/areas/:areaId/features/new      → Create new feature
/products/:productId/areas/:areaId/features/:featureId → Feature details
/products/:productId/areas/:areaId/features/:featureId/edit → Edit feature

// Alternative flat views
/features                                            → All features (filterable)
/features/:featureId                                 → Feature detail view
```

### 4.5 Integrated Views

```
/products/:productId/structure          → Tree view of Areas → Features
/roadmap                                 → Feature roadmap across all products
/backlog                                 → Feature backlog (planned/in-progress)
```

---

## 5. Page Component Structure

### 5.1 Product List Page
**Route**: `/products`

**Components**:
```tsx
<ProductsPage>
  <PageHeader title="Products" action={<CreateProductButton />} />
  <ProductsGrid>
    <ProductCard product={product}>
      <ProductName />
      <ProductStats areasCount={} featuresCount={} />
      <ProductActions />
    </ProductCard>
  </ProductsGrid>
</ProductsPage>
```

**Data Requirements**:
- List of products with counts of areas and features
- Company context

---

### 5.2 Product Areas Page
**Route**: `/products/:productId/areas`

**Components**:
```tsx
<ProductAreasPage>
  <Breadcrumbs company={} product={} />
  <PageHeader title="Product Areas" 
    actions={[
      <CreateAreaButton />,
      <DiscoverAreasButton />  // AI-powered discovery
    ]} 
  />
  <AreasList>
    <AreaCard area={area}>
      <AreaName />
      <AreaDescription />
      <AreaKeywords />
      <FeatureCount />
      <AreaActions />
    </AreaCard>
  </AreasList>
</ProductAreasPage>
```

**Data Requirements**:
- Product areas for the product
- Feature counts per area
- AI discovery available flag (has feedback?)

---

### 5.3 Features List Page
**Route**: `/products/:productId/areas/:areaId/features`

**Components**:
```tsx
<FeaturesPage>
  <Breadcrumbs company={} product={} area={} />
  <PageHeader title="Features" action={<CreateFeatureButton />} />
  <FeaturesTable>
    <FeatureRow feature={feature}>
      <FeatureName />
      <FeatureStatus badge />
      <FeaturePriority badge />
      <FeatureActions />
    </FeatureRow>
  </FeaturesTable>
  <FeatureFilters status priority />
</FeaturesPage>
```

**Data Requirements**:
- Features for the product area
- Filter/sort capabilities

---

### 5.4 Product Structure Page (Tree View)
**Route**: `/products/:productId/structure`

**Components**:
```tsx
<ProductStructurePage>
  <Breadcrumbs company={} product={} />
  <PageHeader title="Product Structure" />
  <TreeView>
    <ProductNode product={product}>
      <AreaNode area={area}>
        <FeatureNode feature={feature} />
        <FeatureNode feature={feature} />
      </AreaNode>
      <AreaNode area={area}>
        <AreaNode area={childArea}>  {/* Nested areas */}
          <FeatureNode feature={feature} />
        </AreaNode>
      </AreaNode>
    </ProductNode>
  </TreeView>
</ProductStructurePage>
```

**Data Requirements**:
- Complete product hierarchy
- All areas and features in tree structure

---

## 6. Key User Flows

### 6.1 Initial Setup Flow
```
1. Create Company (during onboarding)
2. Create Product → "Mobile App"
3. Create Product Areas:
   - Manual creation OR
   - AI-discover from existing feedback
4. Create Features within each area
```

### 6.2 Product Area Discovery Flow
```
1. Navigate to /products/:productId/areas/discover
2. System analyzes existing feedback
3. AI suggests product areas with keywords
4. User reviews and selects suggestions
5. System creates selected areas
6. User can edit/refine areas
```

### 6.3 Feature Management Flow
```
1. Navigate to specific product area
2. View existing features
3. Create new feature
4. Set status and priority
5. Link to insights (future phase)
```

---

## 7. Data Relationships Example

```
Company: "Acme Corp"
  └── Product: "Acme Mobile App"
      ├── Product Area: "Onboarding"
      │   ├── Feature: "Email Verification"
      │   ├── Feature: "Social Login"
      │   └── Feature: "Onboarding Tutorial"
      ├── Product Area: "Dashboard"
      │   ├── Feature: "Analytics Widget"
      │   ├── Feature: "Quick Actions"
      │   └── Feature: "Activity Feed"
      └── Product Area: "Settings"
          ├── Feature: "Profile Management"
          ├── Feature: "Notification Preferences"
          └── Feature: "Privacy Controls"
```

---

## 8. Implementation Priority

### Phase 1: Core CRUD (Week 1)
- [ ] Product management pages
- [ ] Product area management pages
- [ ] Feature management pages
- [ ] Basic list/create/edit/delete for all entities

### Phase 2: Enhanced Features (Week 2)
- [ ] Product area hierarchy support
- [ ] Tree view for product structure
- [ ] Filtering and sorting
- [ ] Search functionality

### Phase 3: AI Integration (Week 3)
- [ ] AI-powered product area discovery
- [ ] Auto-tagging based on keywords
- [ ] Smart suggestions

### Phase 4: Integration (Week 4)
- [ ] Link features to insights
- [ ] Link features to feedback
- [ ] Feature prioritization based on insights

---

## 9. API Response Examples

### Product with Areas
```json
{
  "id": "uuid",
  "name": "Mobile App",
  "description": "Our flagship mobile application",
  "metadata": {},
  "product_areas": [
    {
      "id": "uuid",
      "name": "Onboarding",
      "description": "User signup and initial setup",
      "keywords": ["signup", "registration", "welcome"],
      "feature_count": 5
    }
  ],
  "created_at": "2025-01-04T00:00:00Z",
  "updated_at": "2025-01-04T00:00:00Z"
}
```

### Feature Details
```json
{
  "id": "uuid",
  "name": "Email Verification",
  "description": "Verify user email during signup",
  "status": "in_progress",
  "priority": "high",
  "product_area": {
    "id": "uuid",
    "name": "Onboarding"
  },
  "metadata": {
    "effort_estimate": "3 days",
    "assigned_to": "team-mobile"
  },
  "created_at": "2025-01-04T00:00:00Z",
  "updated_at": "2025-01-05T00:00:00Z"
}
```

---

## 10. Success Criteria

### Data Modeling
- [x] Minimal schemas defined for all entities
- [x] Flexible metadata support
- [x] Clear entity relationships
- [x] Support for hierarchical product areas

### API Completeness
- [ ] Full CRUD operations for all entities
- [ ] Nested routing matching entity hierarchy
- [ ] Filtering and querying capabilities
- [ ] AI-powered discovery endpoints

### User Experience
- [ ] Intuitive navigation through hierarchy
- [ ] Easy product structure visualization
- [ ] Quick feature creation and management
- [ ] Smart AI-assisted area discovery

### Performance
- [ ] Efficient queries with proper indexing
- [ ] Optimized tree traversal for hierarchies
- [ ] Fast list views with pagination
- [ ] Cached aggregate counts

---

## Next Steps

1. **Review and approve this design**
2. **Implement missing database migrations**
3. **Build API endpoints for features**
4. **Create UI pages and components**
5. **Test complete user flows**
6. **Integrate with feedback pipeline** (Phase 1)
