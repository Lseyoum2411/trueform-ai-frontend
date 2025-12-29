import { useEffect } from 'react'
import { useRouter } from 'next/router'

let posthog: any = null
let initialized = false

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    // Only initialize PostHog on the client side
    if (typeof window !== 'undefined' && !initialized) {
      // Get environment variables
      const envKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
      const envHost = process.env.NEXT_PUBLIC_POSTHOG_HOST
      
      // Fallback values (same as your Vercel env vars)
      const fallbackKey = 'phc_AyARmLejdlYSvBP9nWR1SXHA02InDzQ4ez8yWyEAVDQ'
      const fallbackHost = 'https://us.i.posthog.com'
      
      // Use env vars if they're valid (key should be ~51 chars), otherwise use fallback
      const posthogKey = (envKey && envKey.length > 40) ? envKey : fallbackKey
      const posthogHost = envHost || fallbackHost
      
      const usingEnvVars = (envKey && envKey.length > 40) && envHost
      
      console.log('[PostHog] Config:', {
        usingEnvVars,
        keyLength: posthogKey.length,
        keyPrefix: posthogKey.substring(0, 15),
        host: posthogHost
      })

      // Dynamic import to avoid SSR issues
      import('posthog-js').then((posthogModule) => {
        posthog = posthogModule.default
        
        // Only initialize once
        if (posthog && !posthog.__loaded) {
          initialized = true
          
          posthog.init(posthogKey, {
            api_host: posthogHost,
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
