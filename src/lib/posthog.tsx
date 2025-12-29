import { useEffect } from 'react'
import { useRouter } from 'next/router'

let posthog: any = null
let initialized = false

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    // Only initialize PostHog on the client side
    if (typeof window !== 'undefined' && !initialized) {
      const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
      const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

      // TEMPORARY: Hardcode values to test - will switch back to env vars after confirming it works
      const testKey = 'phc_AyARmLejdlYSvBP9nWR1SXHA02InDzQ4ez8yWyEAVDQ'
      const testHost = 'https://us.i.posthog.com'
      
      console.log('[PostHog] Using hardcoded values for testing:', {
        keyLength: testKey.length,
        keyPrefix: testKey.substring(0, 15),
        host: testHost
      })

      // Dynamic import to avoid SSR issues
      import('posthog-js').then((posthogModule) => {
        posthog = posthogModule.default
        
        // Only initialize once
        if (posthog && !posthog.__loaded) {
          initialized = true
          
          posthog.init(testKey, {
            api_host: testHost,
            // Enable autocapture of events
            autocapture: true,
            // Better for Next.js
            loaded: (posthog: any) => {
              console.log('[PostHog] Initialized successfully!')
              if (process.env.NODE_ENV === 'development') {
                posthog.debug() // Enable debug mode in development
              }
              // Track initial pageview after PostHog is loaded
              posthog.capture('$pageview')
            },
          })
        }
      }).catch((error) => {
        console.error('PostHog initialization error:', error)
      })
    }
  }, [])

  useEffect(() => {
    // Track pageviews on route changes
    const handleRouteChange = () => {
      if (typeof window !== 'undefined' && posthog && posthog.__loaded) {
        posthog.capture('$pageview')
      }
    }

    router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return <>{children}</>
}
