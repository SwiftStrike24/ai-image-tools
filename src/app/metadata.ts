import type { Metadata } from "next";

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
        url: 'https://fluxscaleai.com/og-image.jpg',
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
    images: ['https://fluxscaleai.com/twitter-image.jpg'],
  },
};