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
    if (!sport || !['basketball', 'golf', 'weightlifting', 'baseball', 'soccer', 'track_field', 'volleyball'].includes(sport as string)) {
      router.push('/select-sport');
    }
  }, [sport, router]);

  const getSportTitle = (sport: string, exerciseType?: string): string => {
    const titles: Record<string, string> = {
      basketball: 'Basketball',
      golf: 'Golf',
      weightlifting: 'Weightlifting',
      baseball: 'Baseball',
      soccer: 'Soccer',
      track_field: 'Track & Field',
      volleyball: 'Volleyball',
    };
    
    const baseTitle = titles[sport] || 'Upload Video';
    
    if (exerciseType) {
      // Use display names from the registry (normalized IDs)
      const exerciseNames: Record<string, string> = {
        // Basketball
        catch_and_shoot: 'Catch and Shoot',
        shot_off_dribble: 'Shot Off the Dribble',
        free_throw: 'Free Throw',
        jumpshot: 'Jump Shot', // Legacy support
        // Golf
        driver_swing: 'Driver Swing',
        driver: 'Driver Swing', // Legacy support
        iron_swing: 'Iron Swing',
        fairway: 'Iron Swing', // Legacy mapping
        chip_shot: 'Chip Shot',
        chip: 'Chip Shot', // Legacy support
        putting_stroke: 'Putting Stroke',
        putt: 'Putting Stroke', // Legacy support
        // Weightlifting
        barbell_squat: 'Barbell Squat',
        back_squat: 'Barbell Squat', // Legacy support
        front_squat: 'Front Squat',
        deadlift: 'Deadlift',
        romanian_deadlift: 'Romanian Deadlift',
        rdl: 'Romanian Deadlift', // Legacy support
        bench_press: 'Bench Press',
        barbell_row: 'Barbell Row',
        dumbbell_row: 'Dumbbell Row',
        lat_pulldown: 'Lat Pulldown',
        // Baseball
        pitching: 'Pitching',
        batting: 'Batting',
        catcher: 'Catcher',
        fielding: 'Fielding',
        // Soccer
        shooting_technique: 'Shooting Technique',
        passing_technique: 'Passing Technique',
        crossing_technique: 'Crossing Technique',
        dribbling: 'Dribbling',
        receiving: 'Receiving',
        // Track & Field
        sprint_start: 'Sprint Start',
        acceleration_phase: 'Acceleration Phase',
        max_velocity_sprint: 'Max Velocity Sprint',
        // Volleyball
        spike_approach: 'Spike Approach',
        jump_serve: 'Jump Serve',
        blocking_jump: 'Blocking Jump',
      };
      const exerciseName = exerciseNames[exerciseType] || exerciseType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `${baseTitle} - ${exerciseName}`;
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
          <h1 className="text-4xl font-bold text-foreground">
            Upload {getSportTitle(sportName, exerciseType)} Video
          </h1>
          <p className="text-muted-foreground">
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
