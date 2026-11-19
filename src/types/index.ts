// Core types for ReviewLens application

export interface RawReview {
  review_id: string;
  product: string;
  rating: string;
  date: string;
  review_text: string;
}

export interface CleanedReview {
  reviewId: string;
  product: string;
  rating: number | null; // null = unknown rating
  date: string;
  reviewText: string;
  textHash: string; // SHA-256 of normalized text
  status: 'valid' | 'empty' | 'skipped';
}

export type Sentiment = 'positive' | 'neutral' | 'negative';

export type Topic =
  | 'quality'
  | 'delivery'
  | 'price'
  | 'packaging'
  | 'support'
  | 'size_fit'
  | 'other';

export interface AIAnalysis {
  sentiment: Sentiment;
  topics: Topic[];
  summary: string;
  needs_reply: boolean;
}

export interface AnalysedReview extends CleanedReview {
  analysis: AIAnalysis | null;
  analysisStatus: 'success' | 'failed' | 'cached' | 'pending';
  ratingMismatch?: boolean;
}

export interface ProcessingStats {
  totalUploaded: number;
  totalProcessed: number;
  skipped: number;
  duplicates: number;
  cacheHits: number;
  aiCalls: number;
  failed: number;
  durationMs: number;
}

export interface DashboardData {
  reviews: AnalysedReview[];
  stats: ProcessingStats;
  summary: {
    total: number;
    positivePercent: number;
    neutralPercent: number;
    negativePercent: number;
    needsReply: number;
    ratingAgreementPercent: number;
  };
  topComplaints: string[];
  topPraises: string[];
  productAnalytics: ProductAnalytics[];
}

export interface ProductAnalytics {
  product: string;
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  topIssues: string[];
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data?: DashboardData;
  error?: string;
}

export interface ReplyResponse {
  success: boolean;
  reply?: string;
  error?: string;
}
