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
 * Currently only supports countryCode filtering (via file selection)
 * Other filters (city, price, category) are ignored for now
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

  // Apply filters (only countryCode is supported via file selection)
  // City, price, and category filters are ignored for now as per requirements

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
