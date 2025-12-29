import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import '@/styles/globals.css';
import { PostHogProvider } from '@/lib/posthog';

export default function App({ Component, pageProps }: AppProps) {
  // Ensure dark mode is enabled by adding dark class to html element
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <PostHogProvider>
      <Component {...pageProps} />
    </PostHogProvider>
  );
}






