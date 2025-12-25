import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout';
import { usePollStatus } from '@/hooks/usePollStatus';
import { getAnalysisResults, getVideoStatus } from '@/lib/api';
import { AnalysisResult, UIFeedback, VideoStatus } from '@/types';
import { Loader } from '@/components/Loader';

export default function Results() {
  const router = useRouter();
  const { video_id } = router.query;
  const videoId = video_id as string;

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
          // In production, you'd fetch the video URL from the backend
          // For now, we'll use a placeholder or construct from video_id
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

  // Convert backend feedback to UI-friendly format
  const convertFeedbackToUI = (result: AnalysisResult): UIFeedback[] => {
    const uiFeedback: UIFeedback[] = [];

    // Add positive feedback from strengths
    result.strengths.forEach((strength) => {
      uiFeedback.push({
        type: 'positive',
        title: 'Strength',
        description: strength,
      });
    });

    // Add issues from weaknesses/areas_for_improvement
    result.weaknesses.forEach((weakness) => {
      uiFeedback.push({
        type: 'issue',
        title: 'Area for Improvement',
        description: weakness,
        severity: 'medium',
      });
    });

    // Add feedback items from the feedback array
    result.feedback.forEach((item) => {
      uiFeedback.push({
        type: item.severity === 'positive' || item.severity === 'info' ? 'positive' : 'issue',
        title: item.aspect || item.category,
        description: item.message,
        severity: item.severity === 'warning' ? 'high' : item.severity === 'info' ? 'low' : 'medium',
        timestamp: item.timestamp || undefined,
      });
    });

    return uiFeedback.slice(0, 10); // Limit to 10 items
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

  // Results ready
  const uiFeedback = convertFeedbackToUI(analysisResult);
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
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 1 }}
                />
                {analysisResult.pose_data && analysisResult.pose_data.length > 0 && (
                  <PoseOverlay
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
                  <p className="text-xs text-gray-600 mt-2">
                    Note: Video URL serving is not yet implemented. Pose overlay will work once video is available.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Items */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Feedback & Recommendations</h2>

          {uiFeedback.length > 0 ? (
            <div className="grid gap-4">
              {uiFeedback.map((feedback, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-6 ${
                    feedback.type === 'positive'
                      ? 'bg-green-900/20 border-green-600/50'
                      : 'bg-red-900/20 border-red-600/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white">{feedback.title}</h3>
                    {feedback.type === 'positive' ? (
                      <span className="text-green-400 text-sm">✓ Positive</span>
                    ) : (
                      <span
                        className={`text-sm ${
                          feedback.severity === 'high'
                            ? 'text-red-400'
                            : feedback.severity === 'medium'
                            ? 'text-yellow-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {feedback.severity === 'high'
                          ? 'High Priority'
                          : feedback.severity === 'medium'
                          ? 'Medium Priority'
                          : 'Low Priority'}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 mb-2">{feedback.description}</p>
                  {feedback.recommendation && (
                    <p className="text-sm text-blue-400 italic">
                      💡 Recommendation: {feedback.recommendation}
                    </p>
                  )}
                  {feedback.timestamp && (
                    <p className="text-xs text-gray-500 mt-2">
                      At {feedback.timestamp.toFixed(1)}s
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
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

