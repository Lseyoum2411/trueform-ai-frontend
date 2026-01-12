import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { checkWaitlistStatus } from '@/lib/api';

export function useWaitlistAccess() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Get email from localStorage (set when user joins waitlist)
        const email = localStorage.getItem('waitlist_email');
        
        if (!email) {
          // No email in localStorage, redirect to home
          router.push('/');
          return;
        }

        const status = await checkWaitlistStatus(email);
        
        if (status.approved) {
          setApproved(true);
        } else if (status.on_waitlist) {
          // On waitlist but not approved, redirect to waiting page
          router.push('/waiting');
        } else {
          // Not on waitlist, redirect to home
          router.push('/');
        }
      } catch (error) {
        console.error('Failed to check waitlist status:', error);
        // On error, redirect to home
        router.push('/');
      } finally {
        setChecking(false);
      }
    };

    checkAccess();
  }, [router]);

  return { checking, approved };
}

