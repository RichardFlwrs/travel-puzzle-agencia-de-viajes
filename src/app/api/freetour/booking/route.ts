import { NextRequest, NextResponse } from 'next/server';
import { zFTBookingDTO } from '@/lib/api/schemas/FTBooking.Schema';
import { freeTourClient } from '@/lib/api/freetour-client';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        // Validate the request body with Zod schema
        const parsed = zFTBookingDTO.safeParse(body);
        
        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: 'Invalid booking data',
                    details: parsed.error.flatten(),
                },
                { status: 400 }
            );
        }

        const bookingData = parsed.data;

        // Submit booking to FreeTour API
        const result = await freeTourClient.createBooking(bookingData);

        return NextResponse.json(
            {
                success: true,
                message: 'Booking submitted successfully',
                data: result,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Booking submission error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        // Capturar información adicional del error para diagnóstico
        const errorStatus = (error as any)?.status;
        const responseHeaders = (error as any)?.responseHeaders;
        
        // Si el error tiene un status code específico (ej: 403), usarlo en lugar de 500
        const httpStatus = errorStatus && errorStatus >= 400 && errorStatus < 600 
            ? errorStatus 
            : 500;
        
        return NextResponse.json(
            {
                error: 'Failed to process booking',
                message: errorMessage,
                status: errorStatus,
                responseHeaders: process.env.NODE_ENV === 'development' ? responseHeaders : undefined,
                stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
            },
            { status: httpStatus }
        );
    }
}

