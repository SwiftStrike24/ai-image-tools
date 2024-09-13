import dynamic from 'next/dynamic'

const LandingPageClient = dynamic(
  () => import('./client-side/landing-pageClient'),
  { ssr: false }
)

export default function LandingPage() {
  return <LandingPageClient />
}