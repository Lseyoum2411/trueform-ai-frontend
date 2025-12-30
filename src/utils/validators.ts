export const validateVideoFile = async (file: File): Promise<{ valid: boolean; error?: string }> => {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const maxDuration = 12; // 12 seconds
  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload MP4, WebM, MOV, or AVI files.',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size exceeds 100MB limit.',
    };
  }

  // Validate video duration
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    
    video.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      
      const duration = video.duration;
      if (duration > maxDuration) {
        resolve({
          valid: false,
          error: 'For best results, upload videos 12 seconds or shorter. Longer videos may reduce analysis accuracy.',
        });
        return;
      }
      
      resolve({ valid: true });
    });
    
    video.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      // If we can't read duration, allow the upload (backend will validate)
      resolve({ valid: true });
    });
    
    video.src = url;
  });
};






