import { AppProps } from 'next/app'
import { useEffect } from 'react'
import { setupUsageSync } from '@/utils/usageSync'

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const cleanupSync = setupUsageSync()
    return () => cleanupSync()
  }, [])

  return <Component {...pageProps} />
}

export default MyApp
