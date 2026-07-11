import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const viewport: Viewport = {
  themeColor: '#5C8397',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'CalmNest | A Safe Place for Every Mind',
  description: '24/7 AI-powered emotional support, anonymous conversations, and compassionate guidance.',
  metadataBase: new URL('https://calmnest.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'CalmNest | A Safe Place for Every Mind',
    description: '24/7 AI-powered emotional support, anonymous conversations, and compassionate guidance.',
    url: 'https://calmnest.vercel.app',
    siteName: 'CalmNest',
    images: [
      {
        url: '/assets/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CalmNest Wellness Sanctuary',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CalmNest | A Safe Place for Every Mind',
    description: '24/7 AI-powered emotional support, anonymous conversations, and compassionate guidance.',
    images: ['/assets/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body className="antialiased font-sans bg-[#FAF9F6] dark:bg-[#16181D] text-slate-900 transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
