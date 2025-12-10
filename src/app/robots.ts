import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.travelpuzzle.com.mx';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/profile/', '/bookings/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
