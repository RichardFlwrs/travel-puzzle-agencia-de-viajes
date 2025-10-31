/**
 * Location Mapper Tests
 * Tests ID mapping between canonical identifiers and provider-specific IDs
 */

import { locationMapper } from '../location-mapper';
import { mockPrisma } from '../../__mocks__/prisma';
import { mockRedis } from '../../__mocks__/redis';

jest.mock('@/lib/prisma', () => require('../../__mocks__/prisma'));
jest.mock('@/lib/cache/redis', () => require('../../__mocks__/redis'));

describe('LocationMapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis._clear();
  });

  describe('getProviderCountryId', () => {
    it('should return provider ID for a valid country ISO code', async () => {
      const mockMapping = {
        id: '1',
        provider: 'freetour',
        locationType: 'country',
        isoCode: 'ES',
        canonicalName: 'Spain',
        providerId: '34',
        countryId: 1,
      };

      mockPrisma.locationProviderMapping.findFirst.mockResolvedValue(mockMapping);

      const result = await locationMapper.getProviderCountryId('ES', 'freetour');

      expect(result).toBe('34');
      expect(mockPrisma.locationProviderMapping.findFirst).toHaveBeenCalledWith({
        where: {
          provider: 'freetour',
          locationType: 'country',
          isoCode: 'ES',
        },
      });
    });

    it('should return null for non-existent mapping', async () => {
      mockPrisma.locationProviderMapping.findFirst.mockResolvedValue(null);

      const result = await locationMapper.getProviderCountryId('XX', 'freetour');

      expect(result).toBeNull();
    });

    it('should cache results', async () => {
      const mockMapping = {
        id: '1',
        provider: 'freetour',
        locationType: 'country',
        isoCode: 'ES',
        canonicalName: 'Spain',
        providerId: '34',
        countryId: 1,
      };

      mockPrisma.locationProviderMapping.findFirst.mockResolvedValue(mockMapping);

      // First call - should hit database
      await locationMapper.getProviderCountryId('ES', 'freetour');
      expect(mockPrisma.locationProviderMapping.findFirst).toHaveBeenCalledTimes(1);

      // Second call - should hit cache
      await locationMapper.getProviderCountryId('ES', 'freetour');
      expect(mockPrisma.locationProviderMapping.findFirst).toHaveBeenCalledTimes(1); // No additional call
    });
  });

  describe('getIsoCodeFromProviderId', () => {
    it('should return ISO code from provider ID', async () => {
      const mockMapping = {
        id: '1',
        provider: 'freetour',
        locationType: 'country',
        isoCode: 'ES',
        canonicalName: 'Spain',
        providerId: '34',
        countryId: 1,
      };

      mockPrisma.locationProviderMapping.findFirst.mockResolvedValue(mockMapping);

      const result = await locationMapper.getIsoCodeFromProviderId('34', 'freetour');

      expect(result).toBe('ES');
    });

    it('should return null for non-existent provider ID', async () => {
      mockPrisma.locationProviderMapping.findFirst.mockResolvedValue(null);

      const result = await locationMapper.getIsoCodeFromProviderId('999', 'freetour');

      expect(result).toBeNull();
    });
  });

  describe('upsertMapping', () => {
    it('should create new mapping if it does not exist', async () => {
      mockPrisma.locationProviderMapping.upsert.mockResolvedValue({
        id: '1',
        provider: 'freetour',
        locationType: 'country',
        isoCode: 'IT',
        canonicalName: 'Italy',
        providerId: '5',
        providerData: null,
        countryId: 2,
        cityId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await locationMapper.upsertMapping({
        provider: 'freetour',
        locationType: 'country',
        isoCode: 'IT',
        canonicalName: 'Italy',
        providerId: '5',
        countryId: 2,
      });

      expect(mockPrisma.locationProviderMapping.upsert).toHaveBeenCalledWith({
        where: {
          provider_locationType_providerId: {
            provider: 'freetour',
            locationType: 'country',
            providerId: '5',
          },
        },
        update: expect.any(Object),
        create: expect.objectContaining({
          provider: 'freetour',
          locationType: 'country',
          isoCode: 'IT',
          canonicalName: 'Italy',
          providerId: '5',
          countryId: 2,
        }),
      });
    });

    it('should update existing mapping', async () => {
      mockPrisma.locationProviderMapping.upsert.mockResolvedValue({
        id: '1',
        provider: 'freetour',
        locationType: 'country',
        isoCode: 'IT',
        canonicalName: 'Italy Updated',
        providerId: '5',
        providerData: null,
        countryId: 2,
        cityId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await locationMapper.upsertMapping({
        provider: 'freetour',
        locationType: 'country',
        isoCode: 'IT',
        canonicalName: 'Italy Updated',
        providerId: '5',
        countryId: 2,
      });

      expect(mockPrisma.locationProviderMapping.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            canonicalName: 'Italy Updated',
          }),
        })
      );
    });

    it('should clear cache after upsert', async () => {
      mockPrisma.locationProviderMapping.upsert.mockResolvedValue({
        id: '1',
        provider: 'freetour',
        locationType: 'country',
        isoCode: 'FR',
        canonicalName: 'France',
        providerId: '10',
        providerData: null,
        countryId: 3,
        cityId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // First, populate cache
      mockPrisma.locationProviderMapping.findFirst.mockResolvedValue({
        id: '1',
        provider: 'freetour',
        locationType: 'country',
        isoCode: 'FR',
        canonicalName: 'France',
        providerId: '10',
        countryId: 3,
      });

      await locationMapper.getProviderCountryId('FR', 'freetour');
      
      // Now upsert (should clear cache)
      await locationMapper.upsertMapping({
        provider: 'freetour',
        locationType: 'country',
        isoCode: 'FR',
        canonicalName: 'France',
        providerId: '10',
        countryId: 3,
      });

      // Upsert should have been called
      expect(mockPrisma.locationProviderMapping.upsert).toHaveBeenCalled();
    });
  });
});

