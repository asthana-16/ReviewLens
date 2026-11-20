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

const TOPIC_SYNONYM_MAP: Record<string, Topic> = {
  value: 'price',
  cost: 'price',
  pricing: 'price',
  expensive: 'price',
  cheap: 'price',
  affordable: 'price',
  durability: 'quality',
  fabric: 'quality',
  sound: 'quality',
  battery: 'quality',
  material: 'quality',
  build: 'quality',
  performance: 'quality',
  shipping: 'delivery',
  speed: 'delivery',
  arrival: 'delivery',
  courier: 'delivery',
  packing: 'packaging',
  box: 'packaging',
  package: 'packaging',
  service: 'support',
  customer_service: 'support',
  customer_support: 'support',
  refund: 'support',
  fit: 'size_fit',
  size: 'size_fit',
  sizing: 'size_fit',
};

/**
 * Normalizes an array of raw topic strings to strictly valid Topic types.
 * Returns null if topics is empty or contains an unrecognizable topic.
 */
function normalizeTopics(rawTopics: unknown): Topic[] | null {
  if (!Array.isArray(rawTopics) || rawTopics.length === 0) return null;

  const normalized: Topic[] = [];

  for (const item of rawTopics) {
    if (typeof item !== 'string') return null;
    const clean = item.trim().toLowerCase().replace(/[\s-]/g, '_');

    if (VALID_TOPICS.includes(clean as Topic)) {
      if (!normalized.includes(clean as Topic)) normalized.push(clean as Topic);
    } else if (TOPIC_SYNONYM_MAP[clean]) {
      const mapped = TOPIC_SYNONYM_MAP[clean];
      if (!normalized.includes(mapped)) normalized.push(mapped);
    } else {
      return null;
    }
  }

  return normalized.length > 0 ? normalized : null;
}

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
  if (!data || typeof data !== 'object') return null;

  const rawObj = data as Record<string, unknown>;
  const normalizedTopics = normalizeTopics(rawObj.topics);
  if (!normalizedTopics) return null;

  // Pre-process topics through normalization
  const candidate = {
    sentiment: typeof rawObj.sentiment === 'string' ? rawObj.sentiment.toLowerCase() : rawObj.sentiment,
    topics: normalizedTopics,
    summary: typeof rawObj.summary === 'string' ? rawObj.summary.trim() : rawObj.summary,
    needs_reply: Boolean(rawObj.needs_reply),
  };

  const result = aiAnalysisSchema.safeParse(candidate);
  if (result.success) {
    return result.data;
  }
  console.warn('AI response validation failed:', result.error.issues);
  return null;
}

/**
 * Robustly parses a JSON string from the AI and validates it against the Zod schema.
 * Handles conversational wrappers, markdown fences, and leading/trailing whitespace.
 */
export function parseAndValidateAIResponse(raw: string): AIAnalysis | null {
  try {
    let cleaned = raw.trim();

    // 1. Check for markdown code fence blocks: ```json ... ```
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      cleaned = codeBlockMatch[1].trim();
    } else {
      // 2. Extract substring from first '{' to last '}'
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.slice(firstBrace, lastBrace + 1).trim();
      }
    }

    const parsed = JSON.parse(cleaned);
    return validateAIResponse(parsed);
  } catch (err) {
    console.warn('Failed to parse AI response as JSON:', err, '\nRaw input was:', raw.slice(0, 200));
    return null;
  }
}

export { VALID_SENTIMENTS, VALID_TOPICS };
