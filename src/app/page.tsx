import dynamic from 'next/dynamic'

const ImageUpscaler = dynamic(() => import('@/components/ImageUpscaler'), {
  loading: () => <p>Loading...</p>,
  ssr: false
})

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900">
      <ImageUpscaler />
    </main>
  )
}
