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

      // Debug logging to verify env vars are loaded (always show for debugging)
      console.log('[PostHog] Config Check:', {
        envKey: posthogKey ? `Present (${posthogKey.length} chars)` : 'Missing',
        envHost: posthogHost || 'Missing',
        usingHardcoded: 'Testing with hardcoded values'
      })

      if (posthogKey && posthogHost) {
        // Dynamic import to avoid SSR issues
        import('posthog-js').then((posthogModule) => {
          posthog = posthogModule.default
          
          // Only initialize once
          if (posthog && !posthog.__loaded) {
            initialized = true
            
            // Extract ui_host from api_host (us.i.posthog.com -> us.posthog.com)
            const uiHost = posthogHost?.replace('i.posthog.com', 'posthog.com') || 'https://us.posthog.com'
            
            posthog.init(posthogKey, {
              api_host: posthogHost,
              ui_host: uiHost,
              // Enable autocapture of events
              autocapture: true,
              // Person profiles
              person_profiles: 'identified_only',
              // Capture pageviews manually
              capture_pageview: false,
              capture_pageleave: true,
              // Better for Next.js
              loaded: (posthog: any) => {
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
      } else {
        console.warn('PostHog key or host not found. Analytics will not be initialized.')
        console.warn('POSTHOG_KEY:', posthogKey ? 'Present' : 'Missing')
        console.warn('POSTHOG_HOST:', posthogHost || 'Missing')
      }
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
