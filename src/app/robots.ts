import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://lingriser.vn';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/user',
          '/user-management',
          '/exam-creation',
          '/exam-management',
          '/exam-approval',
          '/blog-management',
          '/history',
          '/progress',
          '/results/',
          '/test/do/',
          '/api/',
          '/auth/callback',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
