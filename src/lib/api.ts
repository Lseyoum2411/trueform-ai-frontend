import axios from 'axios';
import { Sport, UploadResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const uploadVideo = async (
  file: File,
  sport: Sport,
  exerciseType: string
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('sport', sport);
  formData.append('exercise_type', exerciseType);

  try {
    const response = await axios.post<UploadResponse>(
      `${API_BASE_URL}/api/v1/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          // Progress can be handled by the hook
        },
      }
    );

    return response.data;
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || error.response?.data?.message || 'Upload failed. Please try again.',
    };
  }
};
