'use client';

import React from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  robots?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  themeColor?: string;
  schema?: Record<string, any> | Record<string, any>[];
}

export default function SEO({
  title,
  description,
  canonicalUrl,
  robots = 'index, follow',
  ogType = 'website',
  ogImage = 'https://calmnest.vercel.app/og-image.png',
  twitterCard = 'summary_large_image',
  themeColor = '#5C8397',
  schema
}: SEOProps) {
  const currentUrl = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <meta name="theme-color" content={themeColor} />

      {/* Open Graph / Facebook */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      {currentUrl && <meta property="og:url" content={currentUrl} />}
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Canonical */}
      {currentUrl && <link rel="canonical" href={currentUrl} />}

      {/* Structured Data (JSON-LD Schema) */}
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema)
          }}
        />
      )}
    </>
  );
}
