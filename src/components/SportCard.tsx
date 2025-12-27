import React from 'react';
import { Sport } from '@/types';

interface SportCardProps {
  sport: Sport;
  title: string;
  description?: string;
  onClick: () => void;
}

const sportIcons: Record<Sport, string> = {
  basketball: '🏀',
  golf: '⛳',
  weightlifting: '🏋️',
};

export const SportCard: React.FC<SportCardProps> = ({
  sport,
  title,
  description,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full p-6 bg-dark-surface border border-dark-border rounded-lg hover:border-blue-500 hover:bg-dark-surface/80 transition-all duration-200 text-left group"
    >
      <div className="flex items-center space-x-4">
        <div className="text-4xl">{sportIcons[sport]}</div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          {description && (
            <p className="text-gray-400 mt-1 text-sm">{description}</p>
          )}
        </div>
        <div className="text-gray-400 group-hover:text-blue-400 transition-colors">
          →
        </div>
      </div>
    </button>
  );
};






