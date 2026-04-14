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
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
