import { useState, useEffect, useRef } from 'react';
import { getVideoStatus } from '@/lib/api';
import { VideoStatus } from '@/types';

interface UsePollStatusOptions {
  videoId: string;
  enabled?: boolean;
  interval?: number;
  onComplete?: (status: VideoStatus) => void;
  onError?: (error: string) => void;
}

export const usePollStatus = ({
  videoId,
  enabled = true,
  interval = 2000,
  onComplete,
  onError,
}: UsePollStatusOptions) => {
  const [status, setStatus] = useState<VideoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !videoId) {
      return;
    }

    const poll = async () => {
      try {
        const currentStatus = await getVideoStatus(videoId);
        setStatus(currentStatus);
        setLoading(false);
        setError(null);

        // Stop polling if terminal state
        if (currentStatus.status === 'completed' || currentStatus.status === 'error') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          if (currentStatus.status === 'completed' && onComplete) {
            onComplete(currentStatus);
          } else if (currentStatus.status === 'error' && onError) {
            onError(currentStatus.error || 'Analysis failed');
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Failed to check status');
        setLoading(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (onError) {
          onError(err.response?.data?.detail || err.message || 'Failed to check status');
        }
      }
    };

    // Initial poll
    poll();

    // Set up interval polling
    intervalRef.current = setInterval(poll, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [videoId, enabled, interval, onComplete, onError]);

  return {
    status,
    loading,
    error,
    isCompleted: status?.status === 'completed',
    isError: status?.status === 'error',
    isProcessing: status?.status === 'processing' || status?.status === 'queued',
  };
};


