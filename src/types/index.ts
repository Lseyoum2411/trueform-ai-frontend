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

// Upload response from backend
export interface UploadResponse {
  video_id: string;
  filename: string;
  sport: string;
  exercise_type: string | null;
  lift_type: string | null;
  uploaded_at: string;
  file_size: number;
  duration: number | null;
  status: string;
  next_poll_url: string;
  next_steps: string;
  // Note: success field removed - API returns video_id on success, throws exception on failure
}

// Status response from backend
export interface VideoStatus {
  video_id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  progress: number | null;
  analysis_id: string | null;
  error: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Feedback item structure
export interface FeedbackItem {
  category: string;
  aspect: string;
  message: string;
  severity: string;
  timestamp: number | null;
  // Optional structured fields for actionable recommendations (basketball-specific)
  observation?: string;
  impact?: string;
  how_to_fix?: string[];
  drill?: string;
  coaching_cue?: string;
  recommendation?: string;
}

// Pose landmark coordinates (x, y, z normalized 0-1)
export interface LandmarkCoordinates {
  x: number;
  y: number;
  z: number;
}

// Pose data for a single frame
export interface PoseDataFrame {
  frame_number: number;
  timestamp: number;
  landmarks: Record<string, LandmarkCoordinates | { x: number; y: number; z: number }>;
  angles?: Record<string, number>;
}

// Analysis result from backend
export interface AnalysisResult {
  video_id: string;
  analysis_id: string | null;
  sport: string;
  exercise_type: string | null;
  lift_type: string | null;
  overall_score: number;
  scores: Record<string, number>;
  feedback: FeedbackItem[];
  strengths: string[];
  weaknesses: string[];
  areas_for_improvement: string[];
  frames_analyzed: number;
  processing_time: number;
  analyzed_at: string;
  pose_data?: PoseDataFrame[]; // Pose data for rendering overlays
}

// UI-friendly feedback structure
export interface UIFeedback {
  type: 'positive' | 'issue';
  title: string;
  description: string;
  severity?: 'low' | 'medium' | 'high';
  recommendation?: string;
  timestamp?: number;
}

// Video upload state for components
export interface VideoUploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  error: string | null;
}
