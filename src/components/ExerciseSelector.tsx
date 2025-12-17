import React from 'react';
import { ExerciseType } from '@/types';

interface ExerciseSelectorProps {
  exerciseTypes: ExerciseType[];
  selectedExercise: string | null;
  onSelect: (exerciseId: string) => void;
  label?: string;
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  exerciseTypes,
  selectedExercise,
  onSelect,
  label = 'Select Exercise Type',
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <select
        value={selectedExercise || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <option value="" disabled>
          Choose an exercise type...
        </option>
        {exerciseTypes.map((exercise) => (
          <option key={exercise.id} value={exercise.id} className="bg-dark-surface">
            {exercise.name}
          </option>
        ))}
      </select>
      {selectedExercise && (
        <p className="text-xs text-gray-400 mt-1">
          {exerciseTypes.find((e) => e.id === selectedExercise)?.description}
        </p>
      )}
    </div>
  );
};
