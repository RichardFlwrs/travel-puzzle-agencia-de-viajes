import { PaginationParams, PaginatedResponse, buildPaginationLinks } from './pagination';
import { TourAPI } from '@/types';

export interface TourFilters {
  language?: string;
  countryId?: number;
  cityId?: number;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: number;
}

/**
 * Paginate JSON tours array with filtering and sorting
 * Supports filtering by: countryId (via file selection), cityId, minPrice, maxPrice, categoryId
 */
export function paginateJsonTours(
  tours: TourAPI[],
  filters: TourFilters,
  pagination: PaginationParams,
  baseUrl: string = '/api/tours'
): PaginatedResponse<TourAPI> {
  const page = Math.max(1, pagination.page || 1);
  const limit = Math.min(100, Math.max(1, pagination.limit || 20));
  const skip = (page - 1) * limit;

  // Start with all tours
  let filteredTours = [...tours];

  // Apply filters in order of selectivity (most selective first for performance)
  
  // City filter (very selective - apply first)
  if (filters.cityId !== undefined) {
    filteredTours = filteredTours.filter(tour => tour.cityId === filters.cityId);
  }

  // Price range filters (selective - apply early)
  if (filters.minPrice !== undefined) {
    filteredTours = filteredTours.filter(tour => tour.price.value >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    filteredTours = filteredTours.filter(tour => tour.price.value <= filters.maxPrice!);
  }

  // Category filter (selective - apply early)
  if (filters.categoryId !== undefined) {
    filteredTours = filteredTours.filter(tour => tour.categoryId === filters.categoryId);
  }

  // Text search filter (less selective but important - apply after other filters for performance)
  if (pagination.searchValue && pagination.searchValue.trim()) {
    const searchLower = pagination.searchValue.toLowerCase().trim();
    const searchTerms = searchLower.split(/\s+/).filter(term => term.length > 0); // Split into words
    
    // Get language from filters or default to 'en'
    const language = filters.language || 'en';
    
    filteredTours = filteredTours.filter(tour => {
      // Get searchable text fields
      const title = (tour.title[language as keyof typeof tour.title] || tour.title.en || '').toLowerCase();
      const brief = (tour.brief?.[language as keyof typeof tour.brief] || tour.brief?.en || '').toLowerCase();
      const description = (tour.description?.[language as keyof typeof tour.description] || tour.description?.en || '').toLowerCase();
      const destination = (tour.meetingPoint?.title || '').toLowerCase();
      
      // Combine all searchable text
      const searchableText = `${title} ${brief} ${description} ${destination}`;
      
      // Check if all search terms are present (AND logic - all words must match)
      // This provides more relevant results than OR logic
      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  // Apply sorting
  if (pagination.sortBy) {
    filteredTours.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (pagination.sortBy) {
        case 'price':
          aValue = a.price.value;
          bValue = b.price.value;
          break;
        case 'rating':
          aValue = a.rating ?? 0;
          bValue = b.rating ?? 0;
          break;
        case 'reviewsNumber':
          aValue = a.reviewsNumber;
          bValue = b.reviewsNumber;
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          // Default to updatedAt descending
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
      }

      if (aValue < bValue) {
        return pagination.sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return pagination.sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  } else {
    // Default sort: updatedAt descending
    filteredTours.sort((a, b) => {
      const aTime = new Date(a.updatedAt).getTime();
      const bTime = new Date(b.updatedAt).getTime();
      return bTime - aTime;
    });
  }

  // Get total count before pagination
  const total = filteredTours.length;

  // Apply pagination
  const paginatedTours = filteredTours.slice(skip, skip + limit);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    data: paginatedTours,
    pagination: {
      total,
      count: paginatedTours.length,
      currentPage: page,
      perPage: limit,
      totalPages,
      links: buildPaginationLinks(baseUrl, pagination, page, totalPages),
    },
  };
}
