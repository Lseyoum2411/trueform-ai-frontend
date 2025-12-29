'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from '@posthog/react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    // Only initialize PostHog on the client side
    if (typeof window !== 'undefined') {
      const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
      const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

      if (posthogKey && posthogHost && !posthog.__loaded) {
        posthog.init(posthogKey, {
          api_host: posthogHost,
          // Enable autocapture of events
          autocapture: true,
          // Capture pageviews automatically
          loaded: (posthog: any) => {
            if (process.env.NODE_ENV === 'development') {
              posthog.debug() // Enable debug mode in development
            }
          },
        })
      } else if (!posthogKey || !posthogHost) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('PostHog key or host not found. Analytics will not be initialized.')
          console.warn('Please set NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST environment variables.')
        }
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

  return <PHProvider client={posthog}>{children}</PHProvider>
}
