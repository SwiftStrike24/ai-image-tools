import { AppProps } from 'next/app'
import { useUsageSync } from '@/utils/usageSync'
import { ClerkProvider } from '@clerk/nextjs'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider>
      <UsageSyncWrapper>
        <Component {...pageProps} />
      </UsageSyncWrapper>
    </ClerkProvider>
  )
}

function UsageSyncWrapper({ children }: { children: React.ReactNode }) {
  useUsageSync();
  return <>{children}</>;
}

export default MyApp
