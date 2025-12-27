import React from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout';
import { Hero7 } from '@/components/ui/modern-hero';

export default function Home() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/select-sport');
  };

  return (
    <Layout>
      <Hero7
        heading="Transform Your Athletic Performance with AI-Powered Form Analysis"
        description="Upload your shot, swing, or lift — get instant AI form feedback. Get personalized coaching for basketball, golf, weightlifting, and baseball."
        button={{
          text: "Get Started",
          onClick: handleGetStarted,
        }}
        reviews={{
          count: 5000,
          sports: [
            { emoji: "🏀", alt: "Basketball" },
            { emoji: "⛳", alt: "Golf" },
            { emoji: "🏋️", alt: "Weightlifting" },
            { emoji: "⚾", alt: "Baseball" },
            { emoji: "🎯", alt: "Sports" },
          ],
        }}
      />
    </Layout>
  );
}





