import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { useUploadVideo } from '@/hooks/useUploadVideo';
import { validateVideoFile } from '@/utils/validators';
import { Sport } from '@/types';
import { Loader } from './Loader';

interface VideoUploadProps {
  sport: Sport;
  exerciseType: string;
  onUploadSuccess?: () => void;
  onError?: (error: string) => void;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  sport,
  exerciseType,
  onUploadSuccess,
  onError,
}) => {
  const router = useRouter();
  const { upload, uploading, error, file } = useUploadVideo();
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback(
    async (selectedFile: File) => {
      const validation = validateVideoFile(selectedFile);
      if (!validation.valid) {
        onError?.(validation.error || 'Invalid file');
        return;
      }

      setPreview(URL.createObjectURL(selectedFile));
      
      try {
        const response = await upload(selectedFile, sport, exerciseType);

        // If upload succeeds, response will have video_id
        if (response.video_id) {
          onUploadSuccess?.();
          // Navigate to results page with video_id using Next.js router
          router.push(`/results?video_id=${response.video_id}`);
        }
      } catch (error: any) {
        // Extract error message from axios error if present
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.detail ||
          error.message ||
          'Upload failed. Please try again.';
        
        onError?.(errorMessage);
      }
    },
    [upload, sport, exerciseType, onUploadSuccess, onError, router]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-dark-border bg-dark-surface'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader />
            <p className="text-gray-400">Uploading video...</p>
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <video
              src={preview}
              controls
              className="max-w-full max-h-64 mx-auto rounded-lg"
            />
            <p className="text-sm text-gray-400">{file?.name}</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="text-4xl">📹</div>
              <div>
                <p className="text-white font-medium mb-2">
                  Drag and drop your video here
                </p>
                <p className="text-gray-400 text-sm mb-4">or</p>
                <label className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
                  Browse Files
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Supported: MP4, WebM, MOV, AVI (Max 100MB)
              </p>
            </div>
          </>
        )}
      </div>
      {error && (
        <div className="mt-4 p-4 bg-red-600/20 border border-red-600 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};
