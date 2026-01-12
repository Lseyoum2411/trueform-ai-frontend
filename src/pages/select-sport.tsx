import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout';
// SportCard removed - using inline buttons to support all sports
import { ExerciseSelector } from '@/components/ExerciseSelector';
import { SportInfo, ExerciseType } from '@/types';
import axios from 'axios';
import { useWaitlistAccess } from '@/hooks/useWaitlistAccess';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Fallback sports data in case API is unavailable
const FALLBACK_SPORTS: SportInfo[] = [
  {
    id: 'basketball',
    name: 'Basketball',
    description: 'Analyze your shooting form',
    requires_exercise_type: true,
    exercise_types: [
      { id: 'catch_and_shoot', name: 'Catch and Shoot', description: 'Shooting immediately after receiving a pass' },
      { id: 'shot_off_dribble', name: 'Shot Off the Dribble', description: 'Creating and shooting a jumpshot after dribbling' },
      { id: 'free_throw', name: 'Free Throw', description: 'Shooting from the free throw line with no defenders' },
    ],
  },
  {
    id: 'golf',
    name: 'Golf',
    description: 'Perfect your swing',
    requires_exercise_type: true,
    exercise_types: [
      { id: 'driver_swing', name: 'Driver Swing', description: 'Full power drive from tee' },
      { id: 'iron_swing', name: 'Iron Swing', description: 'Iron shot swing with controlled trajectory' },
      { id: 'chip_shot', name: 'Chip Shot', description: 'Short approach shot near the green' },
      { id: 'putting_stroke', name: 'Putting Stroke', description: 'Putting stroke on the green' },
    ],
  },
  {
    id: 'weightlifting',
    name: 'Weightlifting',
    description: 'Improve your lifting form',
    requires_exercise_type: true,
    exercise_types: [
      { id: 'back_squat', name: 'Back Squat', description: 'Standard back squat' },
      { id: 'front_squat', name: 'Front Squat', description: 'Front-loaded squat' },
      { id: 'deadlift', name: 'Deadlift', description: 'Conventional deadlift' },
      { id: 'rdl', name: 'RDL', description: 'Romanian deadlift' },
      { id: 'bench_press', name: 'Bench Press', description: 'Chest press' },
      { id: 'barbell_row', name: 'Barbell Row', description: 'Bent-over row' },
      { id: 'dumbbell_row', name: 'Dumbbell Row', description: 'Single or two-arm dumbbell row' },
      { id: 'rear_delt_flies', name: 'Rear Delt Flies', description: 'Rear deltoid isolation exercise' },
      { id: 'lat_pulldown', name: 'Lat Pulldown', description: 'Lat pulldown' },
    ],
  },
  {
    id: 'baseball',
    name: 'Baseball',
    description: 'Analyze your baseball form',
    requires_exercise_type: true,
    exercise_types: [
      { id: 'pitching', name: 'Pitching', description: 'Pitching form and mechanics' },
      { id: 'batting', name: 'Batting', description: 'Batting stance and swing' },
      { id: 'catcher', name: 'Catcher', description: 'Catching form and positioning' },
      { id: 'fielding', name: 'Fielding', description: 'Fielding stance and mechanics' },
    ],
  },
  {
    id: 'soccer',
    name: 'Soccer',
    description: 'Analyze your soccer technique',
    requires_exercise_type: true,
    exercise_types: [
      { id: 'shooting_technique', name: 'Shooting Technique', description: 'Shooting the ball at goal' },
      { id: 'passing_technique', name: 'Passing Technique', description: 'Passing the ball to a teammate' },
      { id: 'crossing_technique', name: 'Crossing Technique', description: 'Crossing the ball from wide areas' },
      { id: 'dribbling', name: 'Dribbling', description: 'Controlling and moving the ball while running' },
      { id: 'first_touch', name: 'First Touch', description: 'Controlling the ball when receiving a pass' },
    ],
  },
  {
    id: 'track_field',
    name: 'Track & Field',
    description: 'Analyze your running form',
    requires_exercise_type: true,
    exercise_types: [
      { id: 'sprint_start', name: 'Sprint Start', description: 'Starting technique from blocks' },
      { id: 'acceleration_phase', name: 'Acceleration Phase', description: 'Accelerating from start to top speed' },
      { id: 'max_velocity_sprint', name: 'Max Velocity Sprint', description: 'Maintaining maximum sprint speed' },
      { id: 'shot_put', name: 'Shot Put', description: 'Analyze lower-body drive, hip rotation, and release mechanics' },
      { id: 'discus_throw', name: 'Discus Throw', description: 'Analyze rotational balance, sequencing, and release angle' },
      { id: 'javelin_throw', name: 'Javelin Throw', description: 'Analyze approach mechanics, torso separation, and throwing motion' },
      { id: 'hurdle_technique', name: 'Hurdle Technique', description: 'Analyze lead-leg mechanics, clearance efficiency, and rhythm' },
    ],
  },
  {
    id: 'volleyball',
    name: 'Volleyball',
    description: 'Analyze your volleyball technique',
    requires_exercise_type: true,
    exercise_types: [
      { id: 'spike_approach', name: 'Spike Approach', description: 'Approach and jumping for a spike attack' },
      { id: 'jump_serve', name: 'Jump Serve', description: 'Serving with a jump and power' },
      { id: 'blocking_jump', name: 'Blocking Jump', description: 'Jumping to block opponent\'s attack' },
    ],
  },
  {
    id: 'lacrosse',
    name: 'Lacrosse',
    description: 'Analyze your lacrosse technique',
    requires_exercise_type: true,
    exercise_types: [
      { id: 'shooting', name: 'Shooting', description: 'Analyze lacrosse shooting mechanics, body alignment, rotational sequencing, and release mechanics' },
    ],
  },
];

export default function SelectSport() {
  const router = useRouter();
  const { checking, approved } = useWaitlistAccess();
  const [sports, setSports] = useState<SportInfo[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportInfo | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const response = await axios.get<SportInfo[]>(`${API_BASE_URL}/api/v1/sports`, {
          timeout: 5000, // 5 second timeout
        });
        
        // Use sports data directly from API (includes all normalized movements)
        const sportsData = response.data;
        setSports(sportsData);
      } catch (err: any) {
        // Silently use fallback data if backend is unavailable
        setSports(FALLBACK_SPORTS);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSports();
  }, []);

  const handleSportSelect = (sportId: string) => {
    const sport = sports.find((s: SportInfo) => s.id === sportId);
    if (!sport) return;

    setSelectedSport(sport);
    setSelectedExercise(null);

    // If sport has exercise types and only one option, go directly to upload
    if (sport.exercise_types && sport.exercise_types.length === 1) {
      router.push(`/upload?sport=${sport.id}&exercise_type=${sport.exercise_types[0].id}`);
    }
  };

  const handleExerciseSelect = (exerciseId: string) => {
    setSelectedExercise(exerciseId);
  };

  const handleContinue = () => {
    if (!selectedSport || !selectedExercise) return;
    router.push(`/upload?sport=${selectedSport.id}&exercise_type=${selectedExercise}`);
  };

  // Loading state
  if (checking || loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!approved) {
    return null; // Hook handles redirect
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Select Your Sport</h1>
          <p className="text-muted-foreground">
            Choose the activity you want to analyze
          </p>
        </div>

        {!selectedSport ? (
          <>
            {sports.length === 0 ? (
              // No sports available (shouldn't happen with fallback, but just in case)
              <div className="text-center py-12">
                <p className="text-destructive mb-4">No sports available</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sports.map((sport: SportInfo) => (
                  <button
                    key={sport.id}
                    onClick={() => handleSportSelect(sport.id)}
                    className="w-full p-6 bg-card border border-border rounded-lg hover:border-primary hover:bg-card/80 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">
                        {sport.id === 'basketball' ? '🏀' :
                         sport.id === 'golf' ? '⛳' :
                         sport.id === 'weightlifting' ? '🏋️' :
                         sport.id === 'baseball' ? '⚾' :
                         sport.id === 'soccer' ? '⚽' :
                         sport.id === 'track_field' ? '🏃' :
                         sport.id === 'volleyball' ? '🏐' :
                         sport.id === 'lacrosse' ? '🥍' : '🎯'}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                          {sport.name}
                        </h3>
                        {sport.description && (
                          <p className="text-muted-foreground mt-1 text-sm">{sport.description}</p>
                        )}
                      </div>
                      <div className="text-muted-foreground group-hover:text-primary transition-colors">
                        →
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{selectedSport.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedSport.description}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedSport(null);
                    setSelectedExercise(null);
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
              </div>

              {selectedSport.requires_exercise_type && selectedSport.exercise_types && (
                <>
                  <ExerciseSelector
                    exerciseTypes={selectedSport.exercise_types}
                    selectedExercise={selectedExercise}
                    onSelect={handleExerciseSelect}
                    label="Select Exercise Type"
                  />
                  <button
                    onClick={handleContinue}
                    disabled={!selectedExercise}
                    className={`mt-6 w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
                      selectedExercise
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    Continue
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
