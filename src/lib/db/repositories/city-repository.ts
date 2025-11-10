import { prisma } from '@/lib/prisma';

export async function upsertCity(id: number, countryId: number) {
  return prisma.city.upsert({
    where: { id },
    update: { countryId },
    create: { id, countryId },
  });
}

export async function upsertCityTranslation(
  cityId: number,
  language: string,
  name: string
) {
  return prisma.cityTranslation.upsert({
    where: {
      cityId_language: {
        cityId,
        language,
      },
    },
    update: { name },
    create: {
      cityId,
      language,
      name,
    },
  });
}

export async function getAllCities(language: string = 'en') {
  return prisma.city.findMany({
    include: {
      translations: { where: { language } },
      country: true, // Country now has translations as JSON field
    },
    orderBy: { id: 'asc' },
  });
}

export async function getCitiesByCountry(countryId: number, language: string = 'en') {
  return prisma.city.findMany({
    where: { countryId },
    include: {
      translations: { where: { language } },
    },
    orderBy: { id: 'asc' },
  });
}

export async function getCityById(id: number, language: string = 'en') {
  return prisma.city.findUnique({
    where: { id },
    include: {
      translations: { where: { language } },
      country: true, // Country now has translations as JSON field
    },
  });
}

