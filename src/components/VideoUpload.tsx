import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { useUploadVideo } from '@/hooks/useUploadVideo';
import { validateVideoFile } from '@/utils/validators';
import { Sport } from '@/types';
import { Loader } from './Loader';
import { capturePostHogEvent } from '@/lib/posthog';

interface VideoUploadProps {
  sport: Sport;
  exerciseType: string;
  onUploadSuccess?: (videoId: string) => void;
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
      const validation = await validateVideoFile(selectedFile);
      if (!validation.valid) {
        onError?.(validation.error || 'Invalid file');
        return;
      }

      setPreview(URL.createObjectURL(selectedFile));
      
      try {
        const response = await upload(selectedFile, sport, exerciseType);

        if (!response.video_id) {
          throw new Error('Upload succeeded but video_id is missing');
        }

        // Track successful video upload in PostHog
        capturePostHogEvent('video_uploaded', { source: 'web' });

        onUploadSuccess?.(response.video_id);
        // Pass filename in query params for video playback
        const params = new URLSearchParams({
          video_id: response.video_id,
        });
        if (response.filename) {
          params.set('filename', response.filename);
        }
        router.push(`/results?${params.toString()}`);
      } catch (err: any) {
        onError?.(
          err?.response?.data?.message ??
          err?.message ??
          'Upload failed'
        );
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
            ? 'border-primary bg-primary/10'
            : 'border-border bg-card'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader />
            <p className="text-muted-foreground">Uploading video...</p>
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <video
              src={preview}
              controls
              className="max-w-full max-h-64 mx-auto rounded-lg"
            />
            <p className="text-sm text-muted-foreground">{file?.name}</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="text-4xl">📹</div>
              <div>
                <p className="text-foreground font-medium mb-2">
                  Drag and drop your video here
                </p>
                <p className="text-muted-foreground text-sm mb-4">or</p>
                <label className="inline-block px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg cursor-pointer transition-colors">
                  Browse Files
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-4">
                Supported: MP4, WebM, MOV, AVI (Max 100MB)
              </p>
            </div>
          </>
        )}
      </div>
      {error && (
        <div className="mt-4 p-4 bg-destructive/20 border border-destructive rounded-lg">
          <p className="text-destructive-foreground text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};
