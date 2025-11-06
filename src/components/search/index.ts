// Search Components - Refactored from original SearchComponents.tsx
// This provides clean exports for the modularized search functionality

export { default as SearchBar } from './SearchBar'
export { default as SearchResults } from './SearchResults'

// Re-export types for convenience
export type { SearchFilters } from './SearchBar'

// Future exports (to be implemented):
// export { default as AdvancedFilters } from './AdvancedFilters'
// export { default as SearchSuggestions } from './SearchSuggestions'
// export { useSearchFilters } from './hooks/useSearchFilters'
// export { useSearchResults } from './hooks/useSearchResults'
// export { useSearchSuggestions } from './hooks/useSearchSuggestions'
