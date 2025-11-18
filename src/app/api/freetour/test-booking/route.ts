import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { freeTourClient } from '@/lib/api/freetour-client';

/**
 * Test endpoint to verify FreeTour getBooking method
 * 
 * Usage:
 * - Local: http://localhost:3000/api/freetour/test-booking
 * - Vercel: https://your-domain.vercel.app/api/freetour/test-booking
 * 
 * This endpoint will:
 * 1. Authenticate with FreeTour API
 * 2. Fetch booking with ID: 59646-20251117185505-400
 * 3. Return booking data or error details
 */
export async function GET(request: NextRequest) {
    const startTime = Date.now();
    const bookingId = '59646-20251117185505-400';

    try {

        // Check environment variables
        if (!process.env.FREETOUR_EMAIL || !process.env.FREETOUR_PASSWORD) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Environment variables not configured',
                    message: 'Please set FREETOUR_EMAIL and FREETOUR_PASSWORD in Vercel environment variables',
                },
                { status: 500 }
            );
        }

        // Fetch booking using FreeTour client
        const bookingData = await freeTourClient.getBooking(bookingId);

        const duration = Date.now() - startTime;

        return NextResponse.json({
            success: true,
            message: 'Booking fetched successfully!',
            bookingId,
            data: bookingData,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
            note: 'Check Vercel logs for detailed response information',
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        console.error('[Test Booking] Booking fetch failed:', errorMessage);
        console.error('[Test Booking] Error details:', error);
        console.error('[Test Booking] Booking ID used:', bookingId);

        return NextResponse.json(
            {
                success: false,
                error: 'Booking fetch failed',
                message: errorMessage,
                bookingId,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString(),
                note: 'Check Vercel logs for detailed error information',
            },
            { status: 500 }
        );
    }
}

