"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from 'lucide-react'

function SuccessPageContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const sessionId = searchParams?.get('session_id')
    if (sessionId) {
      fetch(`/api/subscription/checkout?session_id=${sessionId}`)
        .then(response => response.json())
        .then(data => {
          if (data.status === 'complete') {
            setStatus('success')
            toast({
              title: "Success",
              description: "Your subscription has been activated!",
            })
            // Set a timeout to redirect after 3-5 seconds
            const redirectTimeout = setTimeout(() => {
              router.push('/generator')
            }, 3000 + Math.random() * 2000) // Random delay between 3-5 seconds

            // Clear the timeout if the component unmounts
            return () => clearTimeout(redirectTimeout)
          } else {
            setStatus('error')
            toast({
              title: "Error",
              description: "There was an issue with your subscription. Please contact support.",
              variant: "destructive",
            })
          }
        })
        .catch(() => {
          setStatus('error')
          toast({
            title: "Error",
            description: "An error occurred. Please try again.",
            variant: "destructive",
          })
        })
    }
  }, [searchParams, toast, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-4">
        {status === 'success' ? 'Thank You!' : 'Oops!'}
      </h1>
      <p className="text-xl mb-8">
        {status === 'success'
          ? 'Your subscription has been successfully activated. Redirecting you to the generator...'
          : 'There was an issue processing your subscription.'}
      </p>
      {status === 'success' && (
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      )}
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-900">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>}>
      <SuccessPageContent />
    </Suspense>
  );
}