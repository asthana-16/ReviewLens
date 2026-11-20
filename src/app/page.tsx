'use client';

import { useState } from 'react';
import type { DashboardData, AnalysedReview } from '@/types';
import { aggregateAnalytics } from '@/services/analytics-service';
import Sidebar from '@/components/Sidebar';
import UploadSection from '@/components/UploadSection';
import SummaryCards from '@/components/SummaryCards';
import SentimentChart from '@/components/SentimentChart';
import TopFeedback from '@/components/TopFeedback';
import ReviewsTable from '@/components/ReviewsTable';
import ProcessingStats from '@/components/ProcessingStats';
import ProductAnalytics from '@/components/ProductAnalytics';
import EmptyState from '@/components/EmptyState';
import {
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('dashboard');

  const handleUploadComplete = (dashboardData: DashboardData) => {
    setData(dashboardData);
    setActiveSection('dashboard');
  };

  const handleResetData = () => {
    setData(null);
    setActiveSection('dashboard');
  };

  const handleReviewUpdate = (updatedReview: AnalysedReview) => {
    setData((prev) => {
      if (!prev) return null;
      const newReviews = prev.reviews.map((r) =>
        r.reviewId === updatedReview.reviewId ? updatedReview : r
      );
      return aggregateAnalytics(newReviews, {
        ...prev.stats,
        failed: Math.max(0, prev.stats.failed - 1),
        aiCalls: prev.stats.aiCalls + 1,
      });
    });
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 overflow-hidden">
      {/* Navigation Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        hasData={data !== null}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {activeSection === 'upload'
                  ? 'Upload & Process Reviews'
                  : activeSection === 'products'
                  ? 'Product-Specific Analytics'
                  : activeSection === 'history'
                  ? 'Pipeline Execution History'
                  : activeSection === 'settings'
                  ? 'System Architecture & Settings'
                  : 'Customer Review Intelligence'}
              </h1>
              {data && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Live Dataset
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeSection === 'upload'
                ? 'Upload reviews.csv for automated deduplication, sanitization, and structured AI analysis'
                : activeSection === 'products'
                ? 'Granular sentiment split and top customer pain points categorized by product'
                : activeSection === 'history'
                ? 'Detailed SQLite cache hits, AI batching latency, and request performance metrics'
                : activeSection === 'settings'
                ? 'ReviewLens security configurations, Gemini model parameters, and prompt rules'
                : 'Transform raw, noisy customer feedback into actionable store insights'}
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5">
            {data && (
              <button
                onClick={handleResetData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
                title="Clear current dataset"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset</span>
              </button>
            )}

            <button
              onClick={() => setActiveSection('upload')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
                activeSection === 'upload'
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>{data ? 'Upload New CSV' : 'Upload Reviews'}</span>
            </button>
          </div>
        </header>

        {/* Dynamic Body Content */}
        <div className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Upload View */}
          {activeSection === 'upload' && (
            <UploadSection
              onUploadComplete={handleUploadComplete}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}

          {/* Dashboard View */}
          {activeSection === 'dashboard' && (
            <>
              {!data ? (
                <EmptyState onUploadClick={() => setActiveSection('upload')} />
              ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Summary Metric Cards */}
                  <SummaryCards summary={data.summary} />

                  {/* Analytics Section: Donut Chart + Top Feedback */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SentimentChart summary={data.summary} />
                    <TopFeedback
                      complaints={data.topComplaints}
                      praises={data.topPraises}
                    />
                  </div>

                  {/* Execution Telemetry Activity */}
                  <ProcessingStats stats={data.stats} />

                  {/* Filterable Review Table */}
                  <ReviewsTable
                    reviews={data.reviews}
                    onReviewUpdate={handleReviewUpdate}
                  />
                </div>
              )}
            </>
          )}

          {/* Products View */}
          {activeSection === 'products' && (
            <>
              {!data ? (
                <EmptyState onUploadClick={() => setActiveSection('upload')} />
              ) : (
                <ProductAnalytics products={data.productAnalytics} />
              )}
            </>
          )}

          {/* Processing History View */}
          {activeSection === 'history' && (
            <>
              {!data ? (
                <EmptyState onUploadClick={() => setActiveSection('upload')} />
              ) : (
                <div className="space-y-6">
                  <ProcessingStats stats={data.stats} />
                  <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Cache Architecture Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                        <span className="font-bold text-slate-900">Database Engine</span>
                        <p>SQLite with Write-Ahead Logging (WAL) mode for low-latency concurrent reads.</p>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                        <span className="font-bold text-slate-900">Cache Key Strategy</span>
                        <p>SHA-256 of lowercase, whitespace-normalized review text.</p>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                        <span className="font-bold text-slate-900">Persistence</span>
                        <p>Cached analyses survive server restarts and re-uploads permanently.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Settings View */}
          {activeSection === 'settings' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Security & Prompt Architecture</h3>
                </div>

                <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="font-bold text-slate-900">Prompt Injection Containment</p>
                    <p>
                      Untrusted review inputs are quarantined within strict boundary delimiters:
                      <code className="block mt-1 font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
                        --- BEGIN UNTRUSTED REVIEW TEXT ---
                        <br />
                        [Review Content]
                        <br />
                        --- END UNTRUSTED REVIEW TEXT ---
                      </code>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="font-bold text-slate-900">Zod Schema Enforcement</p>
                    <p>
                      AI responses are strictly validated against JSON schema:
                      <code className="block mt-1 font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
                        &#123; sentiment: &quot;positive&quot; | &quot;neutral&quot; | &quot;negative&quot;, topics: Topic[], summary: string, needs_reply: boolean &#125;
                      </code>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="font-bold text-slate-900">Model Configuration</p>
                    <p>Google Gemini 2.0 Flash with temperature set to 0.1 for deterministic, factual outputs.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
