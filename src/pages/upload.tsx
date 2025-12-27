import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout';
import { VideoUpload } from '@/components/VideoUpload';
import { FeedbackToast } from '@/components/FeedbackToast';
import { Sport } from '@/types';

export default function Upload() {
  const router = useRouter();
  const { sport, exercise_type } = router.query;
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const sportName = sport as Sport;
  const exerciseType = exercise_type as string;

  useEffect(() => {
    if (!sport || !['basketball', 'golf', 'weightlifting', 'baseball'].includes(sport as string)) {
      router.push('/select-sport');
    }
  }, [sport, router]);

  const getSportTitle = (sport: string, exerciseType?: string): string => {
    const titles: Record<string, string> = {
      basketball: 'Basketball Jump Shot',
      golf: 'Golf Swing',
      weightlifting: 'Weightlifting',
      baseball: 'Baseball',
    };
    
    const baseTitle = titles[sport] || 'Upload Video';
    
    if (exerciseType && exerciseType !== 'jumpshot') {
      const exerciseNames: Record<string, string> = {
        driver: 'Driver',
        fairway: 'Fairway Wood',
        chip: 'Chip Shot',
        putt: 'Putt',
        back_squat: 'Back Squat',
        front_squat: 'Front Squat',
        deadlift: 'Deadlift',
        rdl: 'Romanian Deadlift',
        bench_press: 'Bench Press',
        barbell_row: 'Barbell Row',
        dumbbell_row: 'Dumbbell Row',
        rear_delt_flies: 'Rear Delt Flies',
        lat_pulldown: 'Lat Pulldown',
        pitching: 'Pitching',
        batting: 'Batting',
        catcher: 'Catcher',
        fielding: 'Fielding',
      };
      return `${baseTitle} - ${exerciseNames[exerciseType] || exerciseType}`;
    }
    
    return baseTitle;
  };

  const handleUploadSuccess = (videoId: string) => {
    setToast({
      message: 'Video uploaded successfully! Redirecting to analysis...',
      type: 'success',
    });
    // Navigation is handled in VideoUpload component
  };

  const handleError = (error: string) => {
    setToast({
      message: error,
      type: 'error',
    });
  };

  if (!sportName) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">
            Upload {getSportTitle(sportName, exerciseType)} Video
          </h1>
          <p className="text-gray-400">
            Upload a video of your {sportName} performance for AI analysis
          </p>
        </div>
        <VideoUpload
          sport={sportName}
          exerciseType={exerciseType}
          onUploadSuccess={handleUploadSuccess}
          onError={handleError}
        />
        {toast && (
          <FeedbackToast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </Layout>
  );
}
