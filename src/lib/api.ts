import axios from 'axios';
import { Sport, UploadResponse, VideoStatus, AnalysisResult } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Upload video
export const uploadVideo = async (
  file: File,
  sport: Sport,
  exerciseType: string
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('sport', sport);
  if (exerciseType) {
    formData.append('exercise_type', exerciseType);
  }

  // Debug logging
  console.log('Uploading video file:', file.name, file.type, file.size);
  console.log('FormData entries:');
  Array.from(formData.entries()).forEach(([key, value]) => {
    console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
  });

  // IMPORTANT: Do NOT manually set Content-Type header
  // Axios will automatically set it with the correct boundary for multipart/form-data
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/upload`,
      formData
    );

    return response.data;
  } catch (error: any) {
    // Re-throw the error so callers can handle it via try/catch
    // The API returns video_id on success, throws exceptions on failure
    throw error;
  }
};

// Get video status
export const getVideoStatus = async (videoId: string): Promise<VideoStatus> => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/upload/status/${videoId}`);
  return response.data;
};

// Get analysis results
export const getAnalysisResults = async (videoId: string): Promise<AnalysisResult> => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/upload/results/${videoId}`);
  return response.data;
};

// Get sports list
export const getSports = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/sports`);
  return response.data;
};
