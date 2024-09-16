import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const LandingPageClient = dynamic(
  () => import('./client-side/landing-pageClient'),
  { ssr: false }
)

export const metadata: Metadata = {
  title: 'FluxScale AI - Advanced AI Image Generation & Upscaling Tools',
  description: 'Generate, upscale, and customize AI images effortlessly with FLUX.1 and Real-ESRGAN. Create high-quality images in various formats and dimensions.',
  keywords: 'AI image generation, image upscaling, AI art generator, Real-ESRGAN, FLUX.1 AI',
}

export default function LandingPage() {
  return (
    <>
      <LandingPageClient />
    </>
  )
}