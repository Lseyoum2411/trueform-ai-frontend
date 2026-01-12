import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function WaitingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Check if user is actually approved (maybe they were approved since last check)
    const checkAccess = async () => {
      const savedEmail = localStorage.getItem('formlab_email');
      if (!savedEmail) {
        router.push('/');
        return;
      }
      setEmail(savedEmail);

      // Periodically check if user has been approved
      try {
        const response = await fetch(`/api/waitlist/check?email=${encodeURIComponent(savedEmail)}`);
        const data = await response.json();
        
        if (data.approved) {
          // User is approved, redirect to app
          router.push('/select-sport');
        }
      } catch (error) {
        console.error('Error checking access:', error);
      }
    };

    checkAccess();
    
    // Check every 30 seconds if user is approved
    const interval = setInterval(checkAccess, 30000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-8">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-3xl font-bold text-white mb-4">You're on the Waitlist</h2>
          <p className="text-gray-300 mb-6">
            Thanks for your interest! We'll email you at <strong>{email || 'your email'}</strong> as soon as you're approved for access.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            We're onboarding users in batches to ensure the best experience. This page will automatically refresh when you're approved.
          </p>
          <button
            onClick={() => router.push('/')}
            className="text-blue-400 hover:underline"
          >
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}

