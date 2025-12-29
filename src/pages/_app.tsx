import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  // Ensure light mode by removing dark class from html element
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  return <Component {...pageProps} />;
}






