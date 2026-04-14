import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Shipment Tracker',
    short_name: 'Shipment',
    description: 'Integrated Daily Shipment Monitoring System',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a', // slate-900
    theme_color: '#0f172a',
    orientation: 'portrait',
    scope: '/',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
