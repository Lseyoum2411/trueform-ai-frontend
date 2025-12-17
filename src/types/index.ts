export type Sport = 'basketball' | 'golf' | 'weightlifting';

export interface ExerciseType {
  id: string;
  name: string;
  description: string;
}

export interface SportInfo {
  id: string;
  name: string;
  description: string;
  icon?: string;
  requires_exercise_type: boolean;
  exercise_types: ExerciseType[];
}

export interface UploadResponse {
  success: boolean;
  message?: string;
  videoId?: string;
  error?: string;
}

export interface VideoUploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  error: string | null;
}
