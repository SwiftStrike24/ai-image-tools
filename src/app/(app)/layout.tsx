import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'
import dynamic from 'next/dynamic'

const Header = dynamic(() => import('@/components/client-side/HeaderClient'), { ssr: false })

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SignedIn>
        <Header />
        {children}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}