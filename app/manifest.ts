import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CalmNest Wellness Sanctuary',
    short_name: 'CalmNest',
    description: 'An empathetic, private, and anonymous space for mental wellness, journaling, and breathing exercises.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#FAF9F6',
    theme_color: '#5C8397',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/assets/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/assets/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
