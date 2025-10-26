import { NextResponse } from 'next/server';
import { getAllTours, getToursMetadata } from '@/lib/services/tours-service';

export async function GET() {
  try {
    const tours = await getAllTours();
    const metadata = await getToursMetadata();

    return NextResponse.json({
      tours,
      metadata,
    });
  } catch (error) {
    console.error('Tours API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tours' },
      { status: 500 }
    );
  }
}

