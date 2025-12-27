/**
 * Universal feedback formatter for converting metric keys and feedback
 * into professional, human-readable, coach-like text.
 */

import { FeedbackItem } from '@/types';

export interface FormattedFeedback {
  type: 'positive' | 'issue';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  recommendation?: string;
  timestamp?: number;
  // Structured fields for actionable recommendations (basketball-specific)
  observation?: string;
  impact?: string;
  how_to_fix?: string[];
  drill?: string;
  coaching_cue?: string;
  // Structured fields for beginner-friendly weightlifting feedback
  what_we_saw?: string;
  what_it_should_feel_like?: string;
  common_mistake?: string;
  self_check?: string;
}

/**
 * Converts metric keys to human-readable titles
 * Examples:
 * - stance_width → "Stance Width"
 * - follow_through → "Follow-Through"
 * - spin_axis → "Spin Axis"
 * - elbow_alignment → "Elbow Alignment"
 */
export function formatMetricKey(key: string): string {
  if (!key) return '';
  
  // Replace underscores with spaces
  let formatted = key.replace(/_/g, ' ');
  
  // Handle special cases that should use hyphens
  const hyphenCases: Record<string, string> = {
    'follow through': 'Follow-Through',
    'weight transfer': 'Weight Transfer',
    'hip rotation': 'Hip Rotation',
    'knee alignment': 'Knee Alignment',
    'elbow alignment': 'Elbow Alignment',
    'shoulder alignment': 'Shoulder Alignment',
  };
  
  // Check for special hyphen cases
  const lowerKey = formatted.toLowerCase();
  for (const [pattern, replacement] of Object.entries(hyphenCases)) {
    if (lowerKey.includes(pattern)) {
      formatted = formatted.replace(
        new RegExp(pattern, 'gi'),
        replacement
      );
    }
  }
  
  // Capitalize each word
  return formatted
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formats a text string (removes underscores, capitalizes)
 */
export function formatStrengthText(text: string): string {
  if (!text) return '';
  if (!text.includes('_')) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  return formatMetricKey(text);
}

/**
 * Formats a metric label for display
 */
export function formatMetricLabel(key: string): string {
  return formatMetricKey(key);
}

/**
 * Formats feedback item into professional, coach-like structure
 */
export function formatFeedbackItem(item: Partial<FeedbackItem>, fallbackKey?: string): FormattedFeedback {
  const aspectKey = item.aspect || item.category || fallbackKey || 'performance';
  const title = formatFeedbackTitle(aspectKey, item.aspect);
  
  // Use structured fields if available (basketball actionable feedback or weightlifting beginner-friendly feedback)
  const hasBasketballData = !!(item.observation || item.impact || item.how_to_fix || item.drill || item.coaching_cue);
  const hasWeightliftingData = !!(item.what_we_saw || item.what_it_should_feel_like || item.common_mistake || item.self_check);
  const hasStructuredData = hasBasketballData || hasWeightliftingData;
  
  let description: string;
  if (hasWeightliftingData && item.what_we_saw) {
    // Use what_we_saw as the description for weightlifting beginner-friendly feedback
    description = item.what_we_saw;
  } else if (hasBasketballData && item.observation) {
    // Use observation as the description for basketball structured feedback
    description = item.observation;
  } else {
    description = formatFeedbackDescription(aspectKey, item.message || '', item.severity || 'medium');
  }
  
  const priority = mapSeverityToPriority(item.severity || 'medium');
  
  // For structured feedback, use the structured fields directly
  // For non-structured feedback, generate recommendation if needed
  let recommendation: string | undefined;
  if (hasStructuredData) {
    // Structured feedback - recommendation is built from how_to_fix, drill, and cue
    // Will be displayed separately in the UI
    recommendation = undefined;
  } else {
    // Legacy/non-structured feedback - use recommendation field or generate one
    const itemWithRecommendation = item as Partial<FeedbackItem> & { recommendation?: string };
    recommendation = itemWithRecommendation.recommendation 
      ? formatRecommendation(aspectKey, itemWithRecommendation.recommendation)
      : (item.severity !== 'positive' && item.severity !== 'info' ? formatRecommendation(aspectKey) : undefined);
  }

  return {
    type: (item.severity === 'positive' || item.severity === 'info') ? 'positive' : 'issue',
    title,
    description,
    priority,
    recommendation,
    timestamp: item.timestamp || undefined,
    // Include structured fields if available
    observation: item.observation,
    impact: item.impact,
    how_to_fix: item.how_to_fix,
    drill: item.drill,
    coaching_cue: item.coaching_cue,
    // Weightlifting beginner-friendly fields
    what_we_saw: item.what_we_saw,
    what_it_should_feel_like: item.what_it_should_feel_like,
    common_mistake: item.common_mistake,
    self_check: item.self_check,
  };
}

/**
 * Formats feedback title (short, confident coaching headline)
 */
function formatFeedbackTitle(metricKey: string, aspect?: string): string {
  if (aspect && !aspect.includes('_') && aspect.length > 0) {
    // Use aspect if it's clean
    return aspect.charAt(0).toUpperCase() + aspect.slice(1);
  }
  
  return formatMetricKey(metricKey);
}

/**
 * Formats feedback description into professional coaching copy
 */
function formatFeedbackDescription(
  metricKey: string,
  message: string,
  severity: string
): string {
  // If message is already well-formatted (no underscores, good length), use it
  if (message && message.length > 20 && !message.includes('_')) {
    // Capitalize first letter
    return message.charAt(0).toUpperCase() + message.slice(1);
  }
  
  // Otherwise, generate from metric key
  const metricTitle = formatMetricKey(metricKey);
  
  if (severity === 'positive' || severity === 'info') {
    return `Excellent ${metricTitle.toLowerCase()}. This contributes to strong performance and consistency.`;
  }
  
  // For issues, create coaching-friendly message
  const messages: Record<string, string> = {
    'stance_width': 'Your stance width needs adjustment for optimal balance and power generation.',
    'spine_angle': 'Your spine angle requires attention to maintain proper alignment throughout the movement.',
    'hip_rotation': 'Improving hip rotation will enhance power transfer and movement efficiency.',
    'tempo': 'Adjusting your tempo will improve timing and consistency.',
    'weight_transfer': 'Enhancing weight transfer will optimize power generation.',
  };
  
  const lowerKey = metricKey.toLowerCase();
  if (messages[lowerKey]) {
    return messages[lowerKey];
  }
  
  return `Your ${metricTitle.toLowerCase()} needs attention. Focus on improving this aspect for better results.`;
}

/**
 * Maps severity to priority
 */
function mapSeverityToPriority(severity: string): 'low' | 'medium' | 'high' {
  if (severity === 'high' || severity === 'warning') return 'high';
  if (severity === 'low' || severity === 'info' || severity === 'positive') return 'low';
  return 'medium';
}

/**
 * Formats recommendation text for improvements
 */
function formatRecommendation(metricKey: string, recommendation?: string): string | undefined {
  if (recommendation && recommendation.length > 20 && !recommendation.includes('_')) {
    return recommendation.charAt(0).toUpperCase() + recommendation.slice(1);
  }
  
  // Generate generic recommendation based on metric
  const metricTitle = formatMetricKey(metricKey);
  return `Focus on improving your ${metricTitle.toLowerCase()} through targeted practice and form adjustments.`;
}
