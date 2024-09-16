import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { ClerkProvider } from '@clerk/nextjs'
import Script from 'next/script';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'FluxScale AI - Advanced AI Image Generation & Upscaling Tools',
  description: 'FluxScale AI offers cutting-edge AI image generation and upscaling tools powered by FLUX.1 and Real-ESRGAN. Create stunning visuals from text prompts.',
  keywords: 'AI image generation, image upscaling, AI art generator, Real-ESRGAN, FLUX.1 AI',
  openGraph: {
    title: 'FluxScale AI - Advanced AI Image Generation & Upscaling Tools',
    description: 'Generate and upscale AI images with FluxScale AI. Create stunning visuals using FLUX.1 and Real-ESRGAN technology.',
    url: 'https://fluxscaleai.com',
    siteName: 'FluxScale AI',
    images: [
      {
        url: 'https://fluxscaleai.com/og-image.jpg', // Make sure to add this image to your public folder
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FluxScale AI - AI Image Generation & Upscaling',
    description: 'Create and enhance images with advanced AI tools. Try FluxScale AI now!',
    images: ['https://fluxscaleai.com/twitter-image.jpg'], // Add this image to your public folder
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
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
