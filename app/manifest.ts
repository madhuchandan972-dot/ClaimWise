import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'ClaimWise — Emergency Family Vault',
    short_name: 'ClaimWise',
    description: 'Emergency Family Vault, Insurance Claim Advisor & Lifesaver SOS Hub',
    lang: 'en',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Emergency SOS',
        short_name: 'SOS',
        description: 'Broadcast emergency alerts with your location and policy info',
        url: '/dashboard/emergency-sos',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'My Documents',
        short_name: 'Documents',
        description: 'Open your document vault',
        url: '/dashboard/documents',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Emergency Card',
        short_name: 'ICE Card',
        description: 'Show your wallet emergency card with QR',
        url: '/dashboard/emergency-card',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}
