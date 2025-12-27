import React, { useEffect, useRef, useState } from 'react';
import { PoseDataFrame } from '@/types';

interface PoseOverlayCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  poseData: PoseDataFrame[];
  showOverlay: boolean;
}

// MediaPipe pose landmark connections (simplified skeleton)
const POSE_CONNECTIONS = [
  // Face (simplified)
  ['nose', 'left_eye_inner'],
  ['nose', 'right_eye_inner'],
  ['left_eye_inner', 'left_eye'],
  ['right_eye_inner', 'right_eye'],
  ['left_eye', 'left_eye_outer'],
  ['right_eye', 'right_eye_outer'],
  ['left_eye_outer', 'left_ear'],
  ['right_eye_outer', 'right_ear'],
  
  // Upper body
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['right_shoulder', 'right_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  
  // Lower body
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['right_hip', 'right_knee'],
  ['left_knee', 'left_ankle'],
  ['right_knee', 'right_ankle'],
  ['left_ankle', 'left_heel'],
  ['right_ankle', 'right_heel'],
  ['left_heel', 'left_foot_index'],
  ['right_heel', 'right_foot_index'],
] as const;

export const PoseOverlayCanvas: React.FC<PoseOverlayCanvasProps> = ({
  videoRef,
  canvasRef,
  poseData,
  showOverlay,
}) => {
  const animationFrameRef = useRef<number>();
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !showOverlay || !poseData.length) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvas = () => {
      if (!video || !canvas || !ctx) return;

      // Match canvas size to video display size
      const rect = video.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!showOverlay || !poseData.length) {
        return;
      }

      // Find pose data for current video time
      const currentTime = video.currentTime;
      let frameData = poseData.find(
        (frame) => Math.abs(frame.timestamp - currentTime) < 0.1
      );
      if (!frameData) {
        const index = Math.floor((currentTime / video.duration) * poseData.length);
        frameData = poseData[index];
        if (!frameData) {
          frameData = poseData[0];
        }
      }

      if (!frameData || !frameData.landmarks) {
        return;
      }

      // Draw pose skeleton
      ctx.strokeStyle = '#00ff00';
      ctx.fillStyle = '#00ff00';
      ctx.lineWidth = 2;

      // Helper function to safely get coordinate value
      // Uses explicit type checking - NO nullish coalescing or logical OR operators
      const getCoord = (p: any, key: 'x' | 'y'): number => {
        if (p && typeof p[key] === 'number') {
          return p[key];
        }
        return 0;
      };

      // Draw connections
      POSE_CONNECTIONS.forEach(([point1Name, point2Name]) => {
        const point1 = frameData.landmarks[point1Name];
        const point2 = frameData.landmarks[point2Name];

        if (point1 && point2) {
          // Convert normalized coordinates to canvas coordinates
          const x1 = getCoord(point1, 'x') * canvas.width;
          const y1 = getCoord(point1, 'y') * canvas.height;
          const x2 = getCoord(point2, 'x') * canvas.width;
          const y2 = getCoord(point2, 'y') * canvas.height;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      });

      // Draw key points
      Object.entries(frameData.landmarks).forEach(([name, point]) => {
        if (!point) return;

        const x = getCoord(point, 'x') * canvas.width;
        const y = getCoord(point, 'y') * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    };

    const handleTimeUpdate = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updateCanvas);
    };

    const handleResize = () => {
      updateCanvas();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', updateCanvas);
    window.addEventListener('resize', handleResize);

    // Initial draw
    updateCanvas();

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', updateCanvas);
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [videoRef, canvasRef, poseData, showOverlay]);

  return null; // This component doesn't render anything itself
};


