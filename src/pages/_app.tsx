import { AppProps } from 'next/app'
import { useUsageSync } from '@/utils/usageSync'

function MyApp({ Component, pageProps }: AppProps) {
  useUsageSync();  // This will set up the usage sync

  return <Component {...pageProps} />
}

export default MyApp
