import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://karavan-komsusu.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = ['', '/kesfet', '/manzara', '/telsiz', '/pazaryeri', '/rehber', '/gunluk'];
  return routes.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'weekly' : 'daily',
    priority: path === '' ? 1.0 : 0.8,
  }));
}
