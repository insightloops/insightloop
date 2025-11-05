# Data Sources Design Document

## Overview
Simple architecture for handling data in InsightLoop.

## Core Concept
Two types of data:

1. **Structured Data** - Tables with rows and columns. We query with SQL.
2. **Unstructured Data** - Documents, text, files. We search with keywords or semantic search.

## How It Works

### Structured Data
- User uploads CSV, JSON, Excel etc.
- We put it in PostgreSQL tables
- User queries it with SQL: `SELECT * FROM customer_feedback WHERE rating > 4`

### Unstructured Data  
- User uploads PDFs, Word docs, text files etc.
- We store the text content
- User searches with: "Find documents about pricing complaints"

## Data Source Record
Each data source just tracks:
- Name and description
- Whether it's structured or unstructured  
- Where we stored the actual data
- When it was created

That's it.

## Implementation

### For Structured Data:
1. Parse uploaded file (CSV, JSON, Excel)
2. Create PostgreSQL table
3. Import the data
4. Store reference to the table

### For Unstructured Data:
1. Extract text from uploaded files (PDF, Word, etc.)
2. Store text content 
3. Set up search indexing
4. Store reference to the content

## Examples

### Structured Data Source:
```
Name: "Customer Feedback Q3"
Type: Structured  
Data Location: "postgresql://feedback_table_123"
SQL Query: "SELECT * FROM feedback_table_123 WHERE rating > 4"
```

### Unstructured Data Source:
```
Name: "Support Documentation"
Type: Unstructured
Data Location: "documents/support_docs_456"  
Search: "Find documents about billing issues"
```

## Storage Strategy

### Structured Data Storage
- PostgreSQL database
- One table per data source
- Standard SQL queries for analysis

### Unstructured Data Storage  
- Text extraction and storage
- Vector embeddings for semantic search
- Full-text search capabilities

## User Flow

### Upload Process
1. User drags and drops file
2. System detects if structured or unstructured
3. Data gets processed and stored
4. User can immediately query/search

### Query Process
- **Structured**: User writes SQL or uses query builder
- **Unstructured**: User types search terms or questions

## Technical Architecture

### Components
- **File Parser**: Handles CSV, JSON, PDF, Word, etc.
- **SQL Engine**: PostgreSQL for structured queries  
- **Search Engine**: Text and semantic search for unstructured
- **Data Source Manager**: Tracks metadata and locations

### APIs
- `POST /api/data-sources` - Upload new data source
- `GET /api/data-sources` - List all data sources
- `POST /api/data-sources/{id}/query` - Query structured data
- `POST /api/data-sources/{id}/search` - Search unstructured data

That's the entire design. Simple and focused.
