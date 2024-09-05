'use client'

import dynamic from 'next/dynamic'

const FluxAIImageGeneratorClient = dynamic(
  () => import('./client-side/FluxAI-ImageGeneratorClient'),
  { ssr: false }
)

export default function FluxAIImageGenerator() {
  return <FluxAIImageGeneratorClient />
}