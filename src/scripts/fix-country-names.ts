import dotenv from 'dotenv';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { freeTourClient, FreeTourCountry } from '@/lib/api/freetour-client';
import { SupportedLanguage } from '@/types';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'es', 'pt', 'de', 'fr', 'it'];

async function fixCountryNames() {
  console.log('🔧 Fixing country names from FreeTour API...\n');

  // Fetch countries from API
  console.log('📥 Fetching countries data from API...');
  const response = await freeTourClient.fetchCountries();
  const countriesMap = new Map<number, FreeTourCountry>(
    response.data.map((country: FreeTourCountry) => [country.id, country])
  );
  console.log(`✅ Loaded ${countriesMap.size} countries from API\n`);

  // Get all countries from database
  const dbCountries = await prisma.country.findMany({
    include: {
      translations: true,
    },
  });

  let updatedCount = 0;
  let skippedCount = 0;

  for (const country of dbCountries) {
    const countryInfo = countriesMap.get(country.id);
    
    if (!countryInfo) {
      console.log(`  ⚠️  No API data found for country ID ${country.id}, skipping`);
      skippedCount++;
      continue;
    }

    // Update country code if needed
    const correctCode = countryInfo.shortTitle?.toUpperCase() || country.code;
    if (country.code !== correctCode) {
      await prisma.country.update({
        where: { id: country.id },
        data: { code: correctCode },
      });
    }

    // Update all translations
    for (const lang of SUPPORTED_LANGUAGES) {
      const correctName = countryInfo.title[lang];
      
      if (!correctName) continue;
      
      await prisma.countryTranslation.upsert({
        where: {
          countryId_language: {
            countryId: country.id,
            language: lang,
          },
        },
        update: {
          name: correctName,
        },
        create: {
          countryId: country.id,
          language: lang,
          name: correctName,
        },
      });
    }

    console.log(`  ✅ Updated country ID ${country.id}: ${countryInfo.title.en}`);
    updatedCount++;
  }

  console.log(`\n✅ Fixed ${updatedCount} countries`);
  if (skippedCount > 0) {
    console.log(`⚠️  Skipped ${skippedCount} countries (no API data available)`);
  }
}

fixCountryNames()
  .catch((e) => {
    console.error('❌ Error fixing country names:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

