import React from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout';
import { HeroSection } from '@/components/ui/hero-section-dark';

export default function Home() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/select-sport');
  };

  return (
    <Layout>
      <HeroSection
        title="Welcome to FormLab"
        subtitle={{
          regular: "Upload your shot, swing, or lift — get ",
          gradient: "instant AI form feedback",
        }}
        description="Transform your athletic performance with AI-powered form analysis. Get personalized coaching feedback for basketball, golf, weightlifting, and baseball in seconds."
        ctaText="Get Started"
        onCtaClick={handleGetStarted}
        bottomImage={{
          light: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&h=1080&fit=crop",
          dark: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&h=1080&fit=crop",
        }}
        gridOptions={{
          angle: 65,
          opacity: 0.4,
          cellSize: 50,
          lightLineColor: "#4a4a4a",
          darkLineColor: "#2a2a2a",
        }}
      />
    </Layout>
  );
}





