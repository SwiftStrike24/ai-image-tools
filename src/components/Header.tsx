import dynamic from 'next/dynamic'

const HeaderClient = dynamic(
  () => import('./client-side/HeaderClient'),
  { ssr: false }
)

export default function Header() {
  return <HeaderClient />
}