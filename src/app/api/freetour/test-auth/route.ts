import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { freeTourClient } from '@/lib/api/freetour-client';

/**
 * Test endpoint to verify FreeTour authentication and environment variables
 * 
 * Usage:
 * - Local: http://localhost:3000/api/freetour/test-auth
 * - Vercel: https://your-domain.vercel.app/api/freetour/test-auth
 * 
 * This endpoint will:
 * 1. Check if environment variables are set
 * 2. Attempt to authenticate with FreeTour API
 * 3. Return detailed status information
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check environment variables (without exposing sensitive data)
    const envCheck = {
      FREETOUR_EMAIL: process.env.FREETOUR_EMAIL 
        ? `${process.env.FREETOUR_EMAIL.substring(0, 3)}***@${process.env.FREETOUR_EMAIL.split('@')[1] || '***'}`
        : 'NOT SET',
      FREETOUR_PASSWORD: process.env.FREETOUR_PASSWORD 
        ? '***SET***' 
        : 'NOT SET',
      FREETOUR_BASE_URL: process.env.FREETOUR_BASE_URL || 'NOT SET',
    };

    // Log the actual values (will appear in Vercel logs, but masked in response)
    console.log('[Test Auth] Environment check:');
    console.log('FREETOUR_EMAIL:', process.env.FREETOUR_EMAIL ? 'SET' : 'NOT SET');
    console.log('FREETOUR_PASSWORD:', process.env.FREETOUR_PASSWORD ? 'SET' : 'NOT SET');
    console.log('FREETOUR_BASE_URL:', process.env.FREETOUR_BASE_URL || 'NOT SET');

    // Validate environment variables are set
    if (!process.env.FREETOUR_EMAIL || !process.env.FREETOUR_PASSWORD) {
      return NextResponse.json(
        {
          success: false,
          error: 'Environment variables not configured',
          envCheck,
          message: 'Please set FREETOUR_EMAIL and FREETOUR_PASSWORD in Vercel environment variables',
        },
        { status: 500 }
      );
    }

    // Attempt authentication
    console.log('[Test Auth] Attempting authentication...');
    await freeTourClient.authenticate();

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'FreeTour authentication successful!',
      envCheck,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      note: 'Check Vercel logs for detailed authentication logs',
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('[Test Auth] Authentication failed:', errorMessage);
    console.error('[Test Auth] Error details:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Authentication failed',
        message: errorMessage,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        note: 'Check Vercel logs for detailed error information',
      },
      { status: 500 }
    );
  }
}

