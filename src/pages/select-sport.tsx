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

export default function SelectSport() {
  const router = useRouter();
  const [sports, setSports] = useState<SportInfo[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportInfo | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const response = await axios.get<SportInfo[]>(`${API_BASE_URL}/api/v1/sports`);
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
      } catch (error) {
        console.error('Failed to fetch sports:', error);
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Select Your Sport</h1>
          <p className="text-gray-400">
            Choose the activity you want to analyze
          </p>
        </div>

        {!selectedSport ? (
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
