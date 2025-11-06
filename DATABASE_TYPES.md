# Database Type Generation

This project uses Supabase CLI to automatically generate TypeScript types from the database schema.

## Commands

- `npm run db:generate-types` - Generate TypeScript types from the local Supabase database
- `npm run db:reset` - Reset the local database and apply migrations + seed data
- `npm run db:start` - Start the local Supabase instance
- `npm run db:stop` - Stop the local Supabase instance

## Type Files

- `src/types/database-generated.ts` - Auto-generated types from Supabase CLI (DO NOT EDIT)
- `src/types/database.ts` - Custom types and extensions that use the generated types

## Workflow

1. Make changes to database schema in `supabase/migrations/`
2. Reset database: `npm run db:reset`
3. Generate new types: `npm run db:generate-types`
4. Custom types in `database.ts` will automatically inherit the changes

## Schema Overview

The database follows this hierarchy:
- **Companies** (multi-tenant root)
  - **Products** (company's products/services)
    - **Product Areas** (hierarchical organization within products)
      - **Features** (specific capabilities within areas)

Additional entities:
- **Objectives** (OKRs and business goals)
- **Feedback Items** (customer feedback data)
- **Insights** (AI-generated insights)
- **Junction tables** for relationships between insights, features, feedback, and objectives
