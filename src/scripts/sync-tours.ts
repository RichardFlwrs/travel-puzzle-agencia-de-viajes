import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { freeTourClient } from '@/lib/api/freetour-client';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const DATA_DIR = path.join(process.cwd(), 'data');
const TOURS_FILE = path.join(DATA_DIR, 'tours.json');

async function syncTours() {
  console.log('Starting tour sync...');
  const startTime = Date.now();

  try {
    // Fetch tours from API
    const tours = await freeTourClient.fetchAllTours();

    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Write to JSON file
    const data = {
      lastUpdated: new Date().toISOString(),
      totalTours: tours.length,
      tours,
    };

    await fs.writeFile(TOURS_FILE, JSON.stringify(data, null, 2));

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Sync complete! ${tours.length} tours saved in ${duration}s`);
    console.log(`📁 File: ${TOURS_FILE}`);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

syncTours();

