"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/client-side/HeaderClient'), { ssr: false });

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push(`/sign-in?redirect=${pathname}`);
    }
  }, [isLoaded, isSignedIn, router, pathname]);

  if (!isLoaded || !isSignedIn) {
    return null; // Or a loading spinner
  }

  return (
    <>
      <Header />
      {children}
    </>
  );
}