import { prisma } from '@/lib/prisma';

export async function upsertCountry(id: number, code: string) {
  return prisma.country.upsert({
    where: { id },
    update: { code },
    create: { id, code },
  });
}

export async function upsertCountryTranslation(
  countryId: number,
  language: string,
  name: string
) {
  return prisma.countryTranslation.upsert({
    where: {
      countryId_language: {
        countryId,
        language,
      },
    },
    update: { name },
    create: {
      countryId,
      language,
      name,
    },
  });
}

export async function getAllCountries(language: string = 'en') {
  return prisma.country.findMany({
    include: {
      CountryTranslation: { where: { language } },
    },
    orderBy: { id: 'asc' },
  });
}

export async function getCountryById(id: number, language: string = 'en') {
  return prisma.country.findUnique({
    where: { id },
    include: {
      CountryTranslation: { where: { language } },
    },
  });
}

