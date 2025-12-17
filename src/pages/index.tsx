import React from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout';

export default function Home() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/select-sport');
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-white">TrueForm AI</h1>
          <p className="text-xl text-gray-400 max-w-2xl">
            Upload your shot, swing, or lift — get instant AI form feedback
          </p>
        </div>
        <button
          onClick={handleGetStarted}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
        >
          Get Started
        </button>
      </div>
    </Layout>
  );
}




