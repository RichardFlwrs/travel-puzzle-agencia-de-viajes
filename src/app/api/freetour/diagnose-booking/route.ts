import { NextRequest, NextResponse } from 'next/server';
import { freeTourClient } from '@/lib/api/freetour-client';

/**
 * Diagnostic endpoint to help troubleshoot 403 Forbidden errors
 * 
 * This endpoint checks:
 * 1. Server's outbound IP address
 * 2. JWT token scopes/permissions
 * 3. Request headers that will be sent
 * 4. FreeTour API connectivity
 * 
 * Usage: GET /api/freetour/diagnose-booking
 */
export async function GET(request: NextRequest) {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    vercel: {
      region: process.env.VERCEL_REGION || 'not_vercel',
      url: process.env.VERCEL_URL || 'local',
    },
    checks: {},
  };

  try {
    // Check 1: Server's outbound IP address
    try {
      const ipResponse = await fetch('https://ifconfig.me/ip', {
        headers: {
          'User-Agent': 'TravelPuzzle-Diagnostics/1.0',
        },
      });
      const serverIP = await ipResponse.text();
      diagnostics.checks.outboundIP = serverIP.trim();
      diagnostics.checks.ipCheckStatus = 'success';
    } catch (error) {
      // Fallback to alternative IP service
      try {
        const ipResponse2 = await fetch('https://api.ipify.org?format=text', {
          headers: {
            'User-Agent': 'TravelPuzzle-Diagnostics/1.0',
          },
        });
        const serverIP = await ipResponse2.text();
        diagnostics.checks.outboundIP = serverIP.trim();
        diagnostics.checks.ipCheckStatus = 'success';
      } catch (error2) {
        diagnostics.checks.outboundIP = 'Unable to determine';
        diagnostics.checks.ipCheckStatus = 'failed';
        diagnostics.checks.ipCheckError = error2 instanceof Error ? error2.message : 'Unknown error';
      }
    }

    // Check 2: Authenticate and decode token
    try {
      await freeTourClient.authenticate();
      
      // Get the access token (we need to access it, but it's private)
      // For now, we'll just verify authentication works
      diagnostics.checks.authentication = 'success';
      
      // Note: To decode JWT and check scopes, we'd need to:
      // 1. Export the token from FreeTourClient (or add a getter)
      // 2. Use a JWT library to decode it
      // For now, we'll indicate this needs manual checking
      diagnostics.checks.tokenDecode = 'Manual check required - use jwt.io with the token';
      diagnostics.checks.tokenNote = 'To check token scopes, copy the token from server logs and paste it at jwt.io';
    } catch (error) {
      diagnostics.checks.authentication = 'failed';
      diagnostics.checks.authError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check 3: Headers that will be sent
    diagnostics.checks.requestHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'TravelPuzzle-Integration/1.0',
      'Accept-Language': 'en-US,en;q=0.9',
      'Authorization': 'Bearer [TOKEN] (masked)',
    };

    // Check 4: FreeTour API base URL
    diagnostics.checks.freetourBaseURL = 'https://www.freetour.com/partnersAPI/v.2.0';
    diagnostics.checks.bookingEndpoint = `${diagnostics.checks.freetourBaseURL}/booking`;

    // Check 5: Environment variables (masked)
    diagnostics.checks.environment = {
      FREETOUR_EMAIL: process.env.FREETOUR_EMAIL 
        ? `${process.env.FREETOUR_EMAIL.substring(0, 3)}***@${process.env.FREETOUR_EMAIL.split('@')[1] || '***'}`
        : 'NOT SET',
      FREETOUR_PASSWORD: process.env.FREETOUR_PASSWORD ? '***SET***' : 'NOT SET',
    };

    diagnostics.status = 'completed';
    diagnostics.summary = {
      ipCheck: diagnostics.checks.ipCheckStatus,
      authentication: diagnostics.checks.authentication || 'not_checked',
      outboundIP: diagnostics.checks.outboundIP,
      recommendations: [
        `⚠️ IMPORTANT: The outbound IP in ${diagnostics.environment} is: ${diagnostics.checks.outboundIP}`,
        'This IP must be whitelisted with FreeTour for bookings to work',
        'In production (Vercel), the IP will be different from development',
        'Use /api/freetour/outbound-ip to get the production IP after deployment',
        'Decode the JWT token at jwt.io to check for booking scopes/permissions',
        'Ensure User-Agent header is set (now implemented)',
        'Check if Content-Type and Accept headers are correct (now implemented)',
      ],
      nextSteps: [
        '1. Deploy to Vercel production',
        '2. Call GET /api/freetour/outbound-ip to get the production IP',
        '3. Send the production IP to FreeTour dev team for whitelisting',
        '4. Verify token scopes include booking permissions',
      ],
    };

    return NextResponse.json(diagnostics, { status: 200 });
  } catch (error) {
    diagnostics.status = 'error';
    diagnostics.error = error instanceof Error ? error.message : 'Unknown error';
    diagnostics.stack = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.stack : undefined)
      : undefined;

    return NextResponse.json(diagnostics, { status: 500 });
  }
}
