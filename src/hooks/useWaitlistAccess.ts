import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export function useWaitlistAccess() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const email = localStorage.getItem('formlab_email');
    
    if (!email) {
      router.push('/');
      return;
    }

    try {
      const response = await fetch(`/api/waitlist/check?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (!data.approved) {
        router.push('/waiting');
        return;
      }
      
      setApproved(true);
    } catch (error) {
      console.error('Error checking access:', error);
      router.push('/');
    } finally {
      setChecking(false);
    }
  };

  return { checking, approved };
}

