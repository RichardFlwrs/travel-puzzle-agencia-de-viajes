import { prisma } from '@/lib/prisma';

/**
 * LocationMapper Service
 * Handles mapping between ISO codes and provider-specific IDs
 */
export class LocationMapper {
  private cache: Map<string, string | number | null> = new Map();

  /**
   * Get provider-specific country ID from ISO code
   */
  async getProviderCountryId(
    isoCode: string,
    provider: string
  ): Promise<string | number | null> {
    const cacheKey = `${provider}:country:${isoCode}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const mapping = await prisma.locationProviderMapping.findFirst({
        where: {
          provider,
          locationType: 'country',
          isoCode,
        },
      });

      const providerId = mapping?.providerId || null;
      this.cache.set(cacheKey, providerId);
      return providerId;
    } catch (error) {
      console.error(`[LocationMapper] Error fetching country mapping:`, error);
      return null;
    }
  }

  /**
   * Get provider-specific city ID from city name
   */
  async getProviderCityId(
    cityName: string,
    provider: string,
    countryCode?: string
  ): Promise<string | number | null> {
    const cacheKey = `${provider}:city:${cityName}:${countryCode || 'any'}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const where: {
        provider: string;
        locationType: string;
        canonicalName: { equals: string; mode: 'insensitive' };
        countryId?: number;
      } = {
        provider,
        locationType: 'city',
        canonicalName: {
          equals: cityName,
          mode: 'insensitive',
        },
      };

      // If country code provided, filter by it
      if (countryCode) {
        // First get the country mapping to find countryId
        const countryMapping = await prisma.locationProviderMapping.findFirst({
          where: {
            provider,
            locationType: 'country',
            isoCode: countryCode,
          },
        });

        if (countryMapping?.countryId) {
          where.countryId = countryMapping.countryId;
        }
      }

      const mapping = await prisma.locationProviderMapping.findFirst({ where });

      const providerId = mapping?.providerId || null;
      this.cache.set(cacheKey, providerId);
      return providerId;
    } catch (error) {
      console.error(`[LocationMapper] Error fetching city mapping:`, error);
      return null;
    }
  }

  /**
   * Get ISO code from provider-specific country ID (reverse lookup)
   */
  async getIsoCodeFromProviderId(
    providerId: string | number,
    provider: string
  ): Promise<string | null> {
    const cacheKey = `${provider}:iso:${providerId}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as string | null;
    }

    try {
      const mapping = await prisma.locationProviderMapping.findFirst({
        where: {
          provider,
          locationType: 'country',
          providerId: String(providerId),
        },
      });

      const isoCode = mapping?.isoCode || null;
      this.cache.set(cacheKey, isoCode);
      return isoCode;
    } catch (error) {
      console.error(`[LocationMapper] Error reverse lookup:`, error);
      return null;
    }
  }

  /**
   * Get canonical city name from provider city ID
   */
  async getCityNameFromProviderId(
    providerId: string | number,
    provider: string
  ): Promise<string | null> {
    try {
      const mapping = await prisma.locationProviderMapping.findFirst({
        where: {
          provider,
          locationType: 'city',
          providerId: String(providerId),
        },
      });

      return mapping?.canonicalName || null;
    } catch (error) {
      console.error(`[LocationMapper] Error fetching city name:`, error);
      return null;
    }
  }

  /**
   * Upsert a location mapping during sync
   */
  async upsertMapping(data: {
    provider: string;
    locationType: 'country' | 'city';
    isoCode?: string;
    canonicalName: string;
    providerId: string;
    providerData?: Record<string, unknown>;
    countryId?: number;
    cityId?: number;
  }): Promise<void> {
    try {
      await prisma.locationProviderMapping.upsert({
        where: {
          provider_locationType_providerId: {
            provider: data.provider,
            locationType: data.locationType,
            providerId: data.providerId,
          },
        },
        update: {
          isoCode: data.isoCode,
          canonicalName: data.canonicalName,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          providerData: data.providerData as any, // Prisma JsonValue type
          countryId: data.countryId,
          cityId: data.cityId,
          updatedAt: new Date(),
        },
        create: {
          provider: data.provider,
          locationType: data.locationType,
          isoCode: data.isoCode,
          canonicalName: data.canonicalName,
          providerId: data.providerId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          providerData: data.providerData as any, // Prisma JsonValue type
          countryId: data.countryId,
          cityId: data.cityId,
        },
      });

      // Clear cache for this mapping
      const cachePrefix = `${data.provider}:${data.locationType}`;
      this.cache.delete(`${cachePrefix}:${data.isoCode || data.canonicalName}`);
    } catch (error) {
      console.error(`[LocationMapper] Error upserting mapping:`, error);
      throw error;
    }
  }

  /**
   * Clear all cached mappings
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const locationMapper = new LocationMapper();

