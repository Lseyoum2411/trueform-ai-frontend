import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout';
import { usePollStatus } from '@/hooks/usePollStatus';
import { getAnalysisResults, getVideoStatus } from '@/lib/api';
import { AnalysisResult, UIFeedback, VideoStatus } from '@/types';
import { Loader } from '@/components/Loader';
import { PoseOverlayCanvas } from '@/components/PoseOverlayCanvas';
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
  const [showPoseOverlay, setShowPoseOverlay] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
          <p className="text-red-400 mb-4">No video ID provided</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
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
              <h2 className="text-2xl font-bold text-white mb-2">
                {status?.status === 'queued' ? 'Video Queued' : 'Processing Video'}
              </h2>
              <p className="text-gray-400 mb-4">
                {status?.status === 'queued'
                  ? 'Your video is in the queue. Analysis will start shortly...'
                  : `Analyzing your form... ${status?.progress ? Math.round(status.progress) : 0}%`}
              </p>
              {status?.progress && (
                <div className="w-full max-w-md mx-auto bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
            <h2 className="text-2xl font-bold text-red-400 mb-2">Analysis Failed</h2>
            <p className="text-gray-400 mb-6">{errorMessage}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/upload')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
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
          <p className="text-gray-400 mt-4">Loading results...</p>
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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Analysis Results</h1>
            <p className="text-gray-400">
              {analysisResult.sport} • {analysisResult.exercise_type || 'N/A'}
            </p>
          </div>
          <button
            onClick={() => router.push('/select-sport')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Upload Another Video
          </button>
        </div>

        {/* Overall Score */}
        <div className="bg-dark-surface border border-dark-border rounded-lg p-8 text-center">
          <p className="text-gray-400 mb-2">Overall Form Score</p>
          <div className={`text-6xl font-bold ${scoreColor} mb-4`}>
            {Math.round(analysisResult.overall_score)}
          </div>
          <div className="w-full max-w-md mx-auto bg-gray-700 rounded-full h-3">
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
        <div className="bg-dark-surface border border-dark-border rounded-lg overflow-hidden">
          <div className="relative aspect-video bg-gray-900">
            {videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.error('Video playback error:', e);
                    // Try fallback extensions if primary fails
                    if (!videoUrl.includes('.mp4')) {
                      setVideoUrl(`${API_BASE_URL}/uploads/${videoId}.mp4`);
                    }
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 1 }}
                />
                {analysisResult.pose_data && analysisResult.pose_data.length > 0 && (
                  <PoseOverlayCanvas
                    videoRef={videoRef}
                    canvasRef={canvasRef}
                    poseData={analysisResult.pose_data}
                    showOverlay={showPoseOverlay}
                  />
                )}
                {analysisResult.pose_data && analysisResult.pose_data.length > 0 && (
                  <div className="absolute top-4 right-4 z-10">
                    <button
                      onClick={() => setShowPoseOverlay(!showPoseOverlay)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        showPoseOverlay
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      }`}
                    >
                      {showPoseOverlay ? 'Hide Pose' : 'Show Pose'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-6xl">🎥</div>
                  <p className="text-gray-400">Video playback will be available here</p>
                  <p className="text-sm text-gray-500">Video ID: {videoId}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feedback & Recommendations */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-white">Feedback & Recommendations</h2>

          {/* Basketball Jumpshot Disclaimer */}
          {analysisResult.sport === 'basketball' && analysisResult.exercise_type === 'jumpshot' && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Before You Make Changes</h3>
              <p className="text-gray-300 leading-relaxed">
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
                      <h4 className="font-semibold text-white text-lg">{feedback.title}</h4>
                      <span className="text-green-400 text-sm font-medium">✓ Positive</span>
                    </div>
                    <p className="text-gray-200 leading-relaxed">{feedback.description}</p>
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
                    low: 'border-gray-600/50 bg-gray-900/20',
                  };
                  const priorityTextColors = {
                    high: 'text-red-400',
                    medium: 'text-amber-400',
                    low: 'text-gray-400',
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
                        <h4 className="font-semibold text-white text-lg">{feedback.title}</h4>
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
                              <p className="text-sm text-gray-400 font-medium mb-1">Observation</p>
                              <p className="text-gray-200 leading-relaxed">{feedback.observation}</p>
                            </div>
                          )}
                          
                          {/* Impact / Why It Matters */}
                          {feedback.impact && (
                            <div>
                              <p className="text-sm text-gray-400 font-medium mb-1">Why It Matters</p>
                              <p className="text-gray-200 leading-relaxed">{feedback.impact}</p>
                            </div>
                          )}
                          
                          {/* Weightlifting: What We Saw */}
                          {feedback.what_we_saw && (
                            <div>
                              <p className="text-sm text-blue-300 font-medium mb-1">What We Saw</p>
                              <p className="text-gray-200 leading-relaxed">{feedback.what_we_saw}</p>
                            </div>
                          )}
                          
                          {/* How to Fix / How To Fix It */}
                          {feedback.how_to_fix && feedback.how_to_fix.length > 0 && (
                            <div>
                              <p className="text-sm text-blue-300 font-medium mb-2">{feedback.observation ? 'What To Do' : 'How To Fix It'}</p>
                              <ul className="list-disc list-inside space-y-1 text-gray-200">
                                {feedback.how_to_fix.map((fix, fixIndex) => (
                                  <li key={fixIndex} className="leading-relaxed">{fix}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Weightlifting: What It Should Feel Like */}
                          {feedback.what_it_should_feel_like && (
                            <div>
                              <p className="text-sm text-blue-300 font-medium mb-1">What It Should Feel Like</p>
                              <p className="text-gray-200 leading-relaxed">{feedback.what_it_should_feel_like}</p>
                            </div>
                          )}
                          
                          {/* Weightlifting: Common Mistake To Avoid */}
                          {feedback.common_mistake && (
                            <div>
                              <p className="text-sm text-blue-300 font-medium mb-1">Common Mistake To Avoid</p>
                              <p className="text-gray-200 leading-relaxed">{feedback.common_mistake}</p>
                            </div>
                          )}
                          
                          {/* Drill */}
                          {feedback.drill && (
                            <div className="pt-2 border-t border-gray-700/50">
                              <p className="text-sm text-blue-300 font-medium mb-1">💡 Drill</p>
                              <p className="text-gray-200 leading-relaxed">{feedback.drill}</p>
                            </div>
                          )}
                          
                          {/* Coaching Cue */}
                          {feedback.coaching_cue && (
                            <div className="pt-2 border-t border-gray-700/50">
                              <p className="text-sm text-amber-300 font-medium mb-1">🎯 Coaching Cue</p>
                              <p className="text-gray-200 leading-relaxed font-semibold italic">{feedback.coaching_cue}</p>
                            </div>
                          )}
                          
                          {/* Weightlifting: Quick Self-Check */}
                          {feedback.self_check && (
                            <div className="pt-2 border-t border-gray-700/50">
                              <p className="text-sm text-blue-300 font-medium mb-1">Quick Self-Check</p>
                              <p className="text-gray-200 leading-relaxed">{feedback.self_check}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Legacy/non-structured feedback display
                        <>
                          <p className="text-gray-200 leading-relaxed mb-3">{feedback.description}</p>
                          {feedback.recommendation && (
                            <div className="mt-3 pt-3 border-t border-gray-700/50">
                              <p className="text-sm text-blue-300 font-medium">💡 Recommendation</p>
                              <p className="text-gray-300 mt-1">{feedback.recommendation}</p>
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
            <div className="bg-dark-surface border border-dark-border rounded-lg p-8 text-center">
              <p className="text-gray-400">No feedback available yet.</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-4">
          <button
            onClick={() => router.push('/select-sport')}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Analyze Another Video
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </Layout>
  );
}

