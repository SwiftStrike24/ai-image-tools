import dynamic from 'next/dynamic'

const ImageUpscalerClient = dynamic(
  () => import('./client-side/ImageUpscalerClient'),
  { ssr: false }
)

export default function ImageUpscaler() {
  return <ImageUpscalerClient />
}