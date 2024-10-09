"use client"

import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { ClerkProvider } from '@clerk/nextjs'
import Script from 'next/script';
import { useEffect } from 'react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { metadata } from '@/app/metadata'; // Import the metadata

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initializeStore = useSubscriptionStore((state) => state.initializeStore);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          {/* Add metadata to the head */}
          <title>{metadata.title as string}</title>
          <meta name="description" content={metadata.description as string} />
          <meta name="keywords" content={metadata.keywords as string} />
          {/* Add other metadata as needed */}
          <Script id="schema-org" type="application/ld+json">
            {`
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "FluxScale AI",
                "description": "Advanced AI-powered image upscaling and generation tools",
                "operatingSystem": "Web",
                "applicationCategory": "Multimedia",
                "offers": {
                  "@type": "Offer",
                  "price": "0.00",
                  "priceCurrency": "USD"
                },
                "author": {
                  "@type": "Person",
                  "name": "SwiftStrike24"
                },
                "url": "https://fluxscaleai.com"
              }
            `}
          </Script>
        </head>
        <body className={inter.className}>
          <Toaster />
          <SpeedInsights />
          <Analytics />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
