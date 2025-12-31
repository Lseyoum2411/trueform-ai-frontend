import { useState } from 'react';
import { uploadVideo } from '@/lib/api';
import { Sport, UploadResponse, VideoUploadState } from '@/types';

export const useUploadVideo = () => {
  const [state, setState] = useState<VideoUploadState>({
    file: null,
    uploading: false,
    progress: 0,
    error: null,
  });

  const upload = async (
    file: File,
    sport: Sport,
    exerciseType: string
  ): Promise<UploadResponse> => {
    setState({
      file,
      uploading: true,
      progress: 0,
      error: null,
    });

    try {
      const response = await uploadVideo(file, sport, exerciseType);

      setState((prev) => ({
        ...prev,
        uploading: false,
        progress: 100,
      }));

      return response;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        'Upload failed. Please try again.';

      setState((prev) => ({
        ...prev,
        uploading: false,
        error: errorMessage,
      }));

      // Re-throw the error so callers can use try/catch
      throw error;
    }
  };

  const reset = () => {
    setState({
      file: null,
      uploading: false,
      progress: 0,
      error: null,
    });
  };

  return {
    ...state,
    upload,
    reset,
  };
};
