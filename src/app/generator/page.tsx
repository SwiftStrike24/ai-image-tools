import Header from '@/components/Header'
import FluxAIImageGenerator from '@/components/FluxAI-ImageGenerator'

export default function GeneratorPage() {
  return (
    <main className="min-h-screen bg-gray-900">
      <Header />
      <FluxAIImageGenerator />
    </main>
  )
}