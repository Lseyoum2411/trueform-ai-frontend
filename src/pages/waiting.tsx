import React from 'react';
import { Layout } from '@/components/Layout';

export default function Waiting() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-6">
        <div className="text-6xl">⏳</div>
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-3xl font-bold text-foreground">You're on the waitlist!</h1>
          <p className="text-muted-foreground">
            Thank you for your interest. We'll notify you as soon as you get access to the platform.
          </p>
          <p className="text-sm text-muted-foreground">
            Check your email for updates on your approval status.
          </p>
        </div>
      </div>
    </Layout>
  );
}

