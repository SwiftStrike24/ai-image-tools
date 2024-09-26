"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <SignIn afterSignInUrl={redirect} />
    </div>
  );
}