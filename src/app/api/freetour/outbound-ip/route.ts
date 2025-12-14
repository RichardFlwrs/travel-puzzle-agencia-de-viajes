import { NextResponse } from 'next/server';

/**
 * Simple endpoint to get the server's outbound IP address
 * 
 * This is useful for whitelisting with FreeTour API.
 * The IP will be different in production (Vercel) vs development.
 * 
 * Usage: GET /api/freetour/outbound-ip
 * 
 * Returns: { ip: string, environment: string, timestamp: string }
 */
export async function GET() {
  const result: {
    ip: string | null;
    environment: string;
    timestamp: string;
    services: string[];
    error?: string;
  } = {
    ip: null,
    environment: process.env.NODE_ENV || 'unknown',
    timestamp: new Date().toISOString(),
    services: [],
  };

  // Try multiple IP services for reliability
  const ipServices = [
    { url: 'https://ifconfig.me/ip', name: 'ifconfig.me' },
    { url: 'https://api.ipify.org?format=text', name: 'ipify.org' },
    { url: 'https://icanhazip.com', name: 'icanhazip.com' },
    { url: 'https://checkip.amazonaws.com', name: 'aws' },
  ];

  for (const service of ipServices) {
    try {
      const response = await fetch(service.url, {
        headers: {
          'User-Agent': 'TravelPuzzle-IPCheck/1.0',
        },
        // Add timeout to avoid hanging
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const ip = (await response.text()).trim();
        // Validate it looks like an IP address (IPv4 or IPv6)
        if (ip && (ip.match(/^\d+\.\d+\.\d+\.\d+$/) || ip.includes(':'))) {
          result.ip = ip;
          result.services.push(`${service.name}: success`);
          break; // Success, no need to try other services
        } else {
          result.services.push(`${service.name}: invalid format`);
        }
      } else {
        result.services.push(`${service.name}: HTTP ${response.status}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.services.push(`${service.name}: ${errorMsg}`);
    }
  }

  if (!result.ip) {
    result.error = 'Unable to determine outbound IP from any service';
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result, { status: 200 });
}
