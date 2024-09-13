import Header from "@/components/Header";
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs'

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