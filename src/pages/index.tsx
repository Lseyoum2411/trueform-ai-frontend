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
        heading="AI-Powered Movement Analysis for Every Athlete"
        description="Upload your shot, swing, or lift — get instant AI form feedback. Get personalized coaching to improve your form across all your favorite sports."
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





