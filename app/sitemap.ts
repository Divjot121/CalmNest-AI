import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://calmnest.vercel.app';
  const routes = [
    '',
    '/dashboard',
    '/chat',
    '/mood',
    '/journal',
    '/meditation',
    '/habits',
    '/assessments',
    '/login',
    '/signup',
    '/volunteer',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}
