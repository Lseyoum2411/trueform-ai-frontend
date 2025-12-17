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

  const upload = async (file: File, sport: Sport, exerciseType: string): Promise<UploadResponse> => {
    setState({
      file,
      uploading: true,
      progress: 0,
      error: null,
    });

    try {
      const response = await uploadVideo(file, sport, exerciseType);
      
      if (response.success) {
        setState((prev) => ({
          ...prev,
          uploading: false,
          progress: 100,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          uploading: false,
          error: response.error || 'Upload failed',
        }));
      }

      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Upload failed. Please try again.';
      setState((prev) => ({
        ...prev,
        uploading: false,
        error: errorMessage,
      }));

      return {
        success: false,
        error: errorMessage,
      };
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
