import { z } from 'zod';
import type { AIAnalysis, Sentiment, Topic } from '@/types';

const VALID_SENTIMENTS: Sentiment[] = ['positive', 'neutral', 'negative'];
const VALID_TOPICS: Topic[] = [
  'quality',
  'delivery',
  'price',
  'packaging',
  'support',
  'size_fit',
  'other',
];

/**
 * Zod schema for validating AI analysis output.
 * Ensures the LLM response matches our exact expected structure.
 */
export const aiAnalysisSchema = z.object({
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  topics: z
    .array(z.enum(['quality', 'delivery', 'price', 'packaging', 'support', 'size_fit', 'other']))
    .min(1, 'At least one topic is required'),
  summary: z.string().min(1, 'Summary cannot be empty').max(500),
  needs_reply: z.boolean(),
});

/**
 * Validates an AI analysis response against the expected schema.
 * Returns the validated data or null if invalid.
 */
export function validateAIResponse(data: unknown): AIAnalysis | null {
  const result = aiAnalysisSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.warn('AI response validation failed:', result.error.issues);
  return null;
}

/**
 * Attempts to parse a JSON string from the AI and validate it.
 * Handles common issues like markdown code fences in the response.
 */
export function parseAndValidateAIResponse(raw: string): AIAnalysis | null {
  try {
    // Strip markdown code fences if present
    let cleaned = raw.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);
    return validateAIResponse(parsed);
  } catch (err) {
    console.warn('Failed to parse AI response as JSON:', err);
    return null;
  }
}

export { VALID_SENTIMENTS, VALID_TOPICS };
