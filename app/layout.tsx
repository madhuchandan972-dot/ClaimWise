import type { Metadata, Viewport } from 'next'
import './globals.css'
import PwaRegistrar from '@/components/ui/PwaRegistrar'

export const metadata: Metadata = {
  title: {
    default: 'ClaimWise — Emergency Family Vault',
    template: '%s | ClaimWise',
  },
  description:
    'ClaimWise is a secure emergency family vault for documents, property, financial obligations, insurance and emergency contacts — with scholarship discovery for students.',
  keywords: ['family vault', 'emergency', 'documents', 'property', 'insurance', 'scholarship', 'ClaimWise'],
  authors: [{ name: 'ClaimWise' }],
  creator: 'ClaimWise',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ClaimWise',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    title: 'ClaimWise — Emergency Family Vault',
    description: 'Your family\'s important information, protected in one place.',
    siteName: 'ClaimWise',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClaimWise — Emergency Family Vault',
    description: 'Your family\'s important information, protected in one place.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Inter itself is loaded once via the @import in globals.css (all pages);
            preconnects only speed that single stylesheet fetch up. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen bg-white">
        {children}
        <PwaRegistrar />
      </body>
    </html>
  )
}
