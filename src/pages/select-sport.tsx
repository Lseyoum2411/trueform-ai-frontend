import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout';
import { SportCard } from '@/components/SportCard';
import { ExerciseSelector } from '@/components/ExerciseSelector';
import { SportInfo, ExerciseType } from '@/types';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const GOLF_EXERCISE_TYPES: ExerciseType[] = [
  {
    id: 'driver',
    name: 'Driver Swing',
    description: 'Full power drive from tee',
  },
  {
    id: 'iron',
    name: 'Iron Swing',
    description: 'Iron shot swing analysis',
  },
];

// Fallback sports data in case API is unavailable
const FALLBACK_SPORTS: SportInfo[] = [
  {
    id: 'basketball',
    name: 'Basketball',
    description: 'Analyze your shooting form',
    requires_exercise_type: false,
    exercise_types: [],
  },
  {
    id: 'golf',
    name: 'Golf',
    description: 'Perfect your swing',
    requires_exercise_type: true,
    exercise_types: GOLF_EXERCISE_TYPES,
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
      { id: 'lat_pulldown', name: 'Lat Pulldown', description: 'Lat pulldown' },
    ],
  },
];

export default function SelectSport() {
  const router = useRouter();
  const [sports, setSports] = useState<SportInfo[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportInfo | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSports = async () => {
      try {
        setError(null);
        const response = await axios.get<SportInfo[]>(`${API_BASE_URL}/api/v1/sports`, {
          timeout: 5000, // 5 second timeout
        });
        
        const sportsData = response.data.map((sport) => {
          if (sport.id === 'golf') {
            return {
              ...sport,
              exercise_types: GOLF_EXERCISE_TYPES,
            };
          }
          return sport;
        });
        setSports(sportsData);
      } catch (err: any) {
        console.error('Failed to fetch sports:', err);
        
        // Set error message for user feedback
        const errorMessage = err.response?.status === 404
          ? 'Backend API endpoint not found'
          : err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK'
          ? 'Cannot connect to backend server'
          : 'Failed to load sports. Using fallback data.';
        
        setError(errorMessage);
        
        // Use fallback data so page still works
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

    if (sport.id === 'basketball') {
      router.push(`/upload?sport=basketball&exercise_type=jumpshot`);
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
  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-400">Loading sports...</p>
        </div>
      </Layout>
    );
  }

  // Error state (but still show fallback data)
  const showErrorBanner = error && sports.length === FALLBACK_SPORTS.length;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Error banner if using fallback data */}
        {showErrorBanner && (
          <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-yellow-400 text-sm">
                Backend unavailable. Showing fallback sports data.
              </p>
            </div>
          </div>
        )}

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Select Your Sport</h1>
          <p className="text-gray-400">
            Choose the activity you want to analyze
          </p>
        </div>

        {!selectedSport ? (
          <>
            {sports.length === 0 ? (
              // No sports available (shouldn't happen with fallback, but just in case)
              <div className="text-center py-12">
                <p className="text-red-400 mb-4">No sports available</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sports.map((sport: SportInfo) => (
                  <SportCard
                    key={sport.id}
                    sport={sport.id as any}
                    title={sport.name}
                    description={sport.description}
                    onClick={() => handleSportSelect(sport.id)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-dark-surface border border-dark-border rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedSport.name}</h2>
                  <p className="text-sm text-gray-400">{selectedSport.description}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedSport(null);
                    setSelectedExercise(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
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
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
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
