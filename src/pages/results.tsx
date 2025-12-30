import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout';
import { usePollStatus } from '@/hooks/usePollStatus';
import { getAnalysisResults, getVideoStatus } from '@/lib/api';
import { AnalysisResult, UIFeedback, VideoStatus, PoseDataFrame } from '@/types';
import { Loader } from '@/components/Loader';
import { formatFeedbackItem, formatStrengthText, formatMetricLabel, FormattedFeedback } from '@/utils/feedbackFormatter';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Results() {
  const router = useRouter();
  const { video_id, filename } = router.query;
  const videoId = video_id as string;
  const videoFilename = filename as string | undefined;

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll status until completed
  const {
    status,
    loading: statusLoading,
    error: statusError,
    isCompleted,
    isError,
    isProcessing,
  } = usePollStatus({
    videoId: videoId || '',
    enabled: !!videoId && !analysisResult,
    onComplete: async (completedStatus: VideoStatus) => {
      // Fetch results when status is completed
      if (completedStatus.status === 'completed') {
        setLoadingResults(true);
        try {
          const results = await getAnalysisResults(videoId);
          setAnalysisResult(results);
          
          // Construct video URL from backend uploads directory
          // Backend serves videos at /uploads/{filename}
          // Filename comes from upload response (passed as query param) or from results
          let finalFilename = videoFilename;
          if (!finalFilename) {
            // Try to get filename from results if available
            finalFilename = (results as any).filename;
          }
          if (!finalFilename) {
            // Fallback: construct filename from video_id (backend stores as {video_id}{extension})
            // Try common extensions
            const extensions = ['.mp4', '.mov', '.avi', '.webm'];
            // Start with .mp4 as default
            finalFilename = `${videoId}.mp4`;
          }
          const constructedUrl = `${API_BASE_URL}/uploads/${finalFilename}`;
          setVideoUrl(constructedUrl);
        } catch (err: any) {
          setError(err.response?.data?.detail || err.message || 'Failed to load results');
        } finally {
          setLoadingResults(false);
        }
      }
    },
    onError: (err: string) => {
      setError(err);
    },
  });

  // Convert backend feedback to professional, coach-like format
  const processFeedback = (result: AnalysisResult): {
    strengths: FormattedFeedback[];
    improvements: FormattedFeedback[];
  } => {
    const strengths: FormattedFeedback[] = [];
    const improvements: FormattedFeedback[] = [];

    // Process feedback items from the feedback array first (these are already structured)
    result.feedback.forEach((item) => {
      const formatted = formatFeedbackItem(item, item.aspect || item.category);
      if (formatted.type === 'positive') {
        strengths.push(formatted);
      } else {
        improvements.push(formatted);
      }
    });

    // Process strengths array (max 3 total)
    result.strengths?.forEach((strength) => {
      // Skip if we already have this strength from feedback array
      const strengthLabel = formatStrengthText(strength);
      if (!strengths.some(s => s.title === strengthLabel)) {
        const formatted = formatFeedbackItem({
          category: 'Strength',
          aspect: strengthLabel,
          severity: 'positive',
        }, strengthLabel);
        strengths.push(formatted);
      }
    });

    // Process weaknesses/areas_for_improvement (max 4 total improvements)
    const allWeaknesses = [...(result.weaknesses || []), ...(result.areas_for_improvement || [])];
    allWeaknesses.forEach((weakness) => {
      // Skip if we already have this improvement from feedback array
      const weaknessLabel = formatStrengthText(weakness);
      if (!improvements.some(i => i.title === weaknessLabel)) {
        const formatted = formatFeedbackItem({
          category: 'Area for Improvement',
          aspect: weaknessLabel,
          severity: 'medium',
        }, weaknessLabel);
        improvements.push(formatted);
      }
    });

    // Remove duplicates and sort by priority (high -> medium -> low)
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const uniqueStrengths = Array.from(
      new Map(strengths.map(item => [item.title, item])).values()
    ).slice(0, 3);

    const uniqueImprovements = Array.from(
      new Map(improvements.map(item => [item.title, item])).values()
    )
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      .slice(0, 4);

    return {
      strengths: uniqueStrengths,
      improvements: uniqueImprovements,
    };
  };

  if (!videoId) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-destructive mb-4">No video ID provided</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
          >
            Go Home
          </button>
        </div>
      </Layout>
    );
  }

  // Loading state (polling status)
  if (statusLoading || isProcessing) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4 py-12">
            <Loader />
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {status?.status === 'queued' ? 'Video Queued' : 'Processing Video'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {status?.status === 'queued'
                  ? 'Your video is in the queue. Analysis will start shortly...'
                  : `Analyzing your form... ${status?.progress ? Math.round(status.progress) : 0}%`}
              </p>
              {status?.progress && (
                <div className="w-full max-w-md mx-auto bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (isError || error || statusError) {
    const errorMessage = error || statusError || status?.error || 'An error occurred';
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4 py-12">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-destructive mb-2">Analysis Failed</h2>
            <p className="text-muted-foreground mb-6">{errorMessage}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/upload')}
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Loading results
  if (loadingResults || !analysisResult) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <Loader />
          <p className="text-muted-foreground mt-4">Loading results...</p>
        </div>
      </Layout>
    );
  }

  // Results ready - process feedback into professional format
  const { strengths, improvements } = processFeedback(analysisResult);
  const scoreColor =
    analysisResult.overall_score >= 80
      ? 'text-green-400'
      : analysisResult.overall_score >= 60
      ? 'text-yellow-400'
      : 'text-red-400';

  // Format sport name for display
  const getSportDisplayName = (sportId: string): string => {
    const sportNames: Record<string, string> = {
      basketball: 'Basketball',
      golf: 'Golf',
      weightlifting: 'Weightlifting',
      baseball: 'Baseball',
      soccer: 'Soccer',
      track_field: 'Track and Field',
      volleyball: 'Volleyball',
      lacrosse: 'Lacrosse',
    };
    return sportNames[sportId] || sportId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Video + Pose Overlay Component
  const VideoPoseDisplay: React.FC<{
    videoUrl: string;
    poseData: PoseDataFrame[];
    onVideoError: () => void;
  }> = ({ videoUrl, poseData, onVideoError }) => {
    const [showPose, setShowPose] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // MediaPipe pose landmark connections (using named landmarks to match our data structure)
    const POSE_CONNECTIONS = [
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_elbow'],
      ['right_shoulder', 'right_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_elbow', 'right_wrist'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_hip', 'left_knee'],
      ['right_hip', 'right_knee'],
      ['left_knee', 'left_ankle'],
      ['right_knee', 'right_ankle'],
    ] as const;

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const drawPose = () => {
        if (!videoRef.current || !canvasRef.current || !containerRef.current) return;
        if (!showPose || !poseData?.length) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
          return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Wait for video metadata to be loaded
        if (!video.videoWidth || !video.videoHeight) {
          return;
        }

        const currentTime = video.currentTime;
        const frame =
          poseData.find(f => Math.abs(f.timestamp - currentTime) < 0.1) ||
          poseData[0];

        if (!frame?.landmarks) return;

        // Get container dimensions for calculating video display area
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Get video's natural (intrinsic) dimensions
        const videoNaturalWidth = video.videoWidth;
        const videoNaturalHeight = video.videoHeight;
        const videoAspect = videoNaturalWidth / videoNaturalHeight;
        
        // Get container dimensions
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        const containerAspect = containerWidth / containerHeight;

        // Calculate actual video display dimensions (object-fit: contain behavior)
        let displayWidth: number;
        let displayHeight: number;
        let offsetX: number;
        let offsetY: number;

        if (videoAspect > containerAspect) {
          // Video is wider than container - letterboxing (black bars top/bottom)
          displayWidth = containerWidth;
          displayHeight = containerWidth / videoAspect;
          offsetX = 0;
          offsetY = (containerHeight - displayHeight) / 2;
        } else {
          // Video is taller than container - pillarboxing (black bars left/right)
          displayWidth = containerHeight * videoAspect;
          displayHeight = containerHeight;
          offsetX = (containerWidth - displayWidth) / 2;
          offsetY = 0;
        }

        // Set canvas size to match the actual video display area (use device pixel ratio for crisp rendering)
        const dpr = window.devicePixelRatio || 1;
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        
        // Reset transform matrix and scale the context to match device pixel ratio
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        
        // Set CSS size to match display dimensions (this is what the user sees)
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        
        // Position canvas to exactly match video display area
        // offsetX and offsetY are already relative to container, and container has position: relative
        canvas.style.position = 'absolute';
        canvas.style.left = `${offsetX}px`;
        canvas.style.top = `${offsetY}px`;
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '1';

        // Clear canvas
        ctx.clearRect(0, 0, displayWidth, displayHeight);
        
        // Set drawing styles
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.fillStyle = '#00ff00';

        // Draw pose connections
        POSE_CONNECTIONS.forEach(([a, b]) => {
          const p1 = frame.landmarks[a as string];
          const p2 = frame.landmarks[b as string];
          if (!p1 || !p2) return;
          
          const visibility1 = (p1 as any).visibility ?? 1;
          const visibility2 = (p2 as any).visibility ?? 1;
          if (visibility1 < 0.5 || visibility2 < 0.5) return;

          // Convert normalized coordinates (0-1) to canvas coordinates
          // MediaPipe coordinates are normalized to video dimensions
          const x1 = (p1.x ?? 0) * displayWidth;
          const y1 = (p1.y ?? 0) * displayHeight;
          const x2 = (p2.x ?? 0) * displayWidth;
          const y2 = (p2.y ?? 0) * displayHeight;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        });

        // Draw pose landmarks (joints)
        Object.values(frame.landmarks).forEach(p => {
          if (!p) return;
          const visibility = (p as any).visibility ?? 1;
          if (visibility < 0.5) return;
          
          // Convert normalized coordinates to canvas coordinates
          const x = (p.x ?? 0) * displayWidth;
          const y = (p.y ?? 0) * displayHeight;
          
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      };

      const redraw = () => drawPose();

      video.addEventListener('timeupdate', redraw);
      video.addEventListener('play', redraw);
      video.addEventListener('loadedmetadata', redraw);
      window.addEventListener('resize', redraw);

      return () => {
        video.removeEventListener('timeupdate', redraw);
        video.removeEventListener('play', redraw);
        video.removeEventListener('loadedmetadata', redraw);
        window.removeEventListener('resize', redraw);
      };
    }, [poseData, showPose]);

    if (!videoUrl) {
      return (
        <div className="relative aspect-video bg-background">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-6xl">🎥</div>
              <p className="text-muted-foreground">Video playback will be available here</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div
          ref={containerRef}
          className="relative w-full aspect-video bg-black rounded-lg overflow-hidden"
        >
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full h-full object-contain"
            crossOrigin="anonymous"
            onError={onVideoError}
          />

          <canvas
            ref={canvasRef}
            className={`absolute pointer-events-none transition-opacity duration-300 ${
              showPose ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {poseData && poseData.length > 0 && (
            <button
              onClick={() => setShowPose(v => !v)}
              className="absolute top-4 right-4 z-10 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-semibold transition-colors"
            >
              {showPose ? 'Hide Pose' : 'Show Pose'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Analysis Results</h1>
            <p className="text-muted-foreground">
              {getSportDisplayName(analysisResult.sport)} • {analysisResult.exercise_type || 'N/A'}
            </p>
          </div>
          <button
            onClick={() => router.push('/select-sport')}
            className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
          >
            Upload Another Video
          </button>
        </div>

        {/* Overall Score */}
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-2">Overall Form Score</p>
          <div className={`text-6xl font-bold ${scoreColor} mb-4`}>
            {Math.round(analysisResult.overall_score)}
          </div>
          <div className="w-full max-w-md mx-auto bg-muted rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                analysisResult.overall_score >= 80
                  ? 'bg-green-500'
                  : analysisResult.overall_score >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${analysisResult.overall_score}%` }}
            />
          </div>
        </div>

        {/* Video Player with Pose Overlay */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <VideoPoseDisplay
            videoUrl={videoUrl || ''}
            poseData={analysisResult.pose_data || []}
            onVideoError={() => {
              // Try fallback extensions if primary fails
              if (videoUrl && !videoUrl.includes('.mp4')) {
                setVideoUrl(`${API_BASE_URL}/uploads/${videoId}.mp4`);
              }
            }}
          />
        </div>

        {/* Feedback & Recommendations */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-foreground">Feedback & Recommendations</h2>

          {/* Basketball Jumpshot Disclaimer */}
          {analysisResult.sport === 'basketball' && analysisResult.exercise_type === 'jumpshot' && (
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Before You Make Changes</h3>
              <p className="text-muted-foreground leading-relaxed">
                If you are already shooting at a high percentage in games, there may be no need to change your jumpshot. Many effective shooters succeed with mechanics that are unique to them.
              </p>
            </div>
          )}

          {/* Strengths Section */}
          {strengths.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-green-400 flex items-center gap-2">
                <span>✓</span> Strengths
              </h3>
              <div className="grid gap-4">
                {strengths.map((feedback, index) => (
                  <div
                    key={`strength-${index}`}
                    className="bg-green-900/20 border border-green-600/50 rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-foreground text-lg">{feedback.title}</h4>
                      <span className="text-green-400 text-sm font-medium">✓ Positive</span>
                    </div>
                    <p className="text-foreground/80 leading-relaxed">{feedback.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Areas for Improvement Section */}
          {improvements.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-amber-400 flex items-center gap-2">
                <span>⚡</span> Areas for Improvement
              </h3>
              <div className="grid gap-4">
                {improvements.map((feedback, index) => {
                  const priorityColors = {
                    high: 'border-red-600/50 bg-red-900/20',
                    medium: 'border-amber-600/50 bg-amber-900/20',
                    low: 'border-border bg-card/50',
                  };
                  const priorityTextColors = {
                    high: 'text-red-400',
                    medium: 'text-amber-400',
                    low: 'text-muted-foreground',
                  };
                  const priorityLabels = {
                    high: 'High Priority',
                    medium: 'Medium Priority',
                    low: 'Low Priority',
                  };

                  return (
                    <div
                      key={`improvement-${index}`}
                      className={`border rounded-lg p-6 ${priorityColors[feedback.priority]}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-foreground text-lg">{feedback.title}</h4>
                        <span className={`text-sm font-medium ${priorityTextColors[feedback.priority]}`}>
                          {priorityLabels[feedback.priority]}
                        </span>
                      </div>

                      {/* Check if this is structured actionable feedback (basketball or weightlifting) */}
                      {(feedback.observation || feedback.impact || feedback.how_to_fix || feedback.drill || feedback.coaching_cue) ||
                       (feedback.what_we_saw || feedback.what_it_should_feel_like || feedback.common_mistake || feedback.self_check) ? (
                        // Structured actionable feedback display
                        <div className="space-y-4">
                          {/* Observation */}
                          {feedback.observation && (
                            <div>
                              <p className="text-sm text-muted-foreground font-medium mb-1">Observation</p>
                              <p className="text-foreground/80 leading-relaxed">{feedback.observation}</p>
                            </div>
                          )}
                          
                          {/* Impact / Why It Matters */}
                          {feedback.impact && (
                            <div>
                              <p className="text-sm text-muted-foreground font-medium mb-1">Why It Matters</p>
                              <p className="text-foreground/80 leading-relaxed">{feedback.impact}</p>
                            </div>
                          )}
                          
                          {/* Weightlifting: What We Saw */}
                          {feedback.what_we_saw && (
                            <div>
                              <p className="text-sm text-primary font-medium mb-1">What We Saw</p>
                              <p className="text-foreground/80 leading-relaxed">{feedback.what_we_saw}</p>
                            </div>
                          )}
                          
                          {/* How to Fix / How To Fix It */}
                          {feedback.how_to_fix && feedback.how_to_fix.length > 0 && (
                            <div>
                              <p className="text-sm text-primary font-medium mb-2">{feedback.observation ? 'What To Do' : 'How To Fix It'}</p>
                              <ul className="list-disc list-inside space-y-1 text-foreground/80">
                                {feedback.how_to_fix.map((fix, fixIndex) => (
                                  <li key={fixIndex} className="leading-relaxed">{fix}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Weightlifting: What It Should Feel Like */}
                          {feedback.what_it_should_feel_like && (
                            <div>
                              <p className="text-sm text-primary font-medium mb-1">What It Should Feel Like</p>
                              <p className="text-foreground/80 leading-relaxed">{feedback.what_it_should_feel_like}</p>
                            </div>
                          )}
                          
                          {/* Weightlifting: Common Mistake To Avoid */}
                          {feedback.common_mistake && (
                            <div>
                              <p className="text-sm text-primary font-medium mb-1">Common Mistake To Avoid</p>
                              <p className="text-foreground/80 leading-relaxed">{feedback.common_mistake}</p>
                            </div>
                          )}
                          
                          {/* Drill */}
                          {feedback.drill && (
                            <div className="pt-2 border-t border-border/50">
                              <p className="text-sm text-primary font-medium mb-1">💡 Drill</p>
                              <p className="text-foreground/80 leading-relaxed">{feedback.drill}</p>
                            </div>
                          )}
                          
                          {/* Coaching Cue */}
                          {feedback.coaching_cue && (
                            <div className="pt-2 border-t border-border/50">
                              <p className="text-sm text-amber-400 font-medium mb-1">🎯 Coaching Cue</p>
                              <p className="text-foreground/80 leading-relaxed font-semibold italic">{feedback.coaching_cue}</p>
                            </div>
                          )}
                          
                          {/* Weightlifting: Quick Self-Check */}
                          {feedback.self_check && (
                            <div className="pt-2 border-t border-border/50">
                              <p className="text-sm text-primary font-medium mb-1">Quick Self-Check</p>
                              <p className="text-foreground/80 leading-relaxed">{feedback.self_check}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Legacy/non-structured feedback display
                        <>
                          <p className="text-foreground/80 leading-relaxed mb-3">{feedback.description}</p>
                          {feedback.recommendation && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <p className="text-sm text-primary font-medium">💡 Recommendation</p>
                              <p className="text-foreground/70 mt-1">{feedback.recommendation}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {strengths.length === 0 && improvements.length === 0 && (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground">No feedback available yet.</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-4">
          <button
            onClick={() => router.push('/select-sport')}
            className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors"
          >
            Analyze Another Video
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </Layout>
  );
}
