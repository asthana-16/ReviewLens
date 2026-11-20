'use client';

import { useState, useEffect, useCallback } from 'react';
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
  FileSpreadsheet,
  Layers,
  ChevronDown,
  Clock,
  Database,
  Loader2,
  Trash2,
  ExternalLink,
} from 'lucide-react';

export default function Home() {
  const [data, setData] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [activeDatasetId, setActiveDatasetId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  // Fetch list of all uploaded datasets from SQLite
  const fetchDatasets = useCallback(async () => {
    try {
      const res = await fetch('/api/datasets');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.datasets)) {
          setDatasets(json.datasets);
          return json.datasets;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch dataset list:', err);
    }
    return [];
  }, []);

  // Load a specific dataset by ID
  const loadDataset = useCallback(async (datasetId) => {
    if (!datasetId) return;
    setIsSwitching(true);
    try {
      const res = await fetch(`/api/datasets?id=${encodeURIComponent(datasetId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          setActiveDatasetId(datasetId);
        }
      }
    } catch (err) {
      console.error('Error switching dataset:', err);
    } finally {
      setIsSwitching(false);
    }
  }, []);

  // Initial load: fetch datasets and load latest dataset if available
  useEffect(() => {
    fetchDatasets().then((list) => {
      if (list && list.length > 0 && !data) {
        loadDataset(list[0].id);
      }
    });
  }, [fetchDatasets, loadDataset, data]);

  // When a new CSV upload completes
  const handleUploadComplete = async (dashboardData) => {
    setData(dashboardData);
    if (dashboardData.dataset?.id) {
      setActiveDatasetId(dashboardData.dataset.id);
    }
    await fetchDatasets();
    setActiveSection('dashboard');
  };

  const handleResetData = () => {
    setData(null);
    setActiveDatasetId(null);
    setActiveSection('dashboard');
  };

  const handleDeleteDataset = async (datasetId) => {
    try {
      const res = await fetch(`/api/datasets?id=${encodeURIComponent(datasetId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const updatedList = await fetchDatasets();
        if (activeDatasetId === datasetId) {
          if (updatedList.length > 0) {
            loadDataset(updatedList[0].id);
          } else {
            setData(null);
            setActiveDatasetId(null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete dataset:', err);
    }
  };

  const handleReviewUpdate = (updatedReview) => {
    setData((prev) => {
      if (!prev) return null;
      const newReviews = prev.reviews.map((r) =>
        r.reviewId === updatedReview.reviewId ? updatedReview : r
      );
      return {
        ...aggregateAnalytics(newReviews, {
          ...prev.stats,
          failed: Math.max(0, prev.stats.failed - 1),
          aiCalls: prev.stats.aiCalls + 1,
        }),
        dataset: prev.dataset,
      };
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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span className="font-mono text-[11px] font-bold">
                    {data.dataset?.filename || 'Live Dataset'}
                  </span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeSection === 'upload'
                ? 'Upload reviews.csv for automated deduplication, sanitization, and structured AI analysis'
                : activeSection === 'products'
                ? 'Granular sentiment split and top customer pain points categorized by product'
                : activeSection === 'history'
                ? 'Review isolated dataset runs, SQLite cache hits, and switch between previous uploads'
                : activeSection === 'settings'
                ? 'ReviewLens security configurations, Gemini model parameters, and prompt rules'
                : 'Transform raw, noisy customer feedback into actionable store insights'}
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* Dataset Selector Dropdown (When multiple datasets exist) */}
            {datasets.length > 1 && (
              <div className="relative inline-flex items-center">
                <select
                  value={activeDatasetId || ''}
                  onChange={(e) => loadDataset(e.target.value)}
                  disabled={isSwitching}
                  className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  title="Switch between uploaded datasets"
                >
                  {datasets.map((ds) => (
                    <option key={ds.id} value={ds.id}>
                      {ds.filename} ({ds.totalUploaded} revs)
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {isSwitching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
            )}

            {data && (
              <button
                onClick={handleResetData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
                title="Clear current view"
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
          {/* Switching dataset loading banner */}
          {isSwitching && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-3 text-indigo-800 text-xs font-semibold animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Switching dataset and recalculating isolated metrics...</span>
            </div>
          )}

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
                  {/* Active Dataset Banner */}
                  <div className="bg-white rounded-xl border border-slate-200/80 px-5 py-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {data.dataset?.filename || 'Current Dataset'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600">
                            {data.dataset?.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Uploaded: {new Date(data.dataset?.createdAt || Date.now()).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500 font-medium">
                        Showing strictly <strong className="text-slate-900 font-bold">{data.reviews.length}</strong> records isolated to this dataset.
                      </span>
                    </div>
                  </div>

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
                    datasetId={data.dataset?.id}
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
            <div className="space-y-6">
              {/* Dataset History Cards / Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Uploaded Datasets History</h3>
                      <p className="text-xs text-slate-500">
                        Every upload is isolated with a unique dataset ID in SQLite. Click any dataset to load its metrics.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {datasets.length} {datasets.length === 1 ? 'Dataset' : 'Datasets'} Saved
                  </span>
                </div>

                {datasets.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No datasets uploaded yet. Upload a CSV to view history here.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-4">Dataset Name & ID</th>
                          <th className="py-3 px-4">Uploaded At</th>
                          <th className="py-3 px-4">Reviews</th>
                          <th className="py-3 px-4">Cache Hits</th>
                          <th className="py-3 px-4">AI Calls</th>
                          <th className="py-3 px-4">Duration</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {datasets.map((ds) => {
                          const isActive = ds.id === activeDatasetId;
                          return (
                            <tr
                              key={ds.id}
                              className={`transition-colors ${
                                isActive
                                  ? 'bg-indigo-50/40 hover:bg-indigo-50/70 font-medium'
                                  : 'hover:bg-slate-50/80'
                              }`}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <FileSpreadsheet
                                    className={`w-4 h-4 ${
                                      isActive ? 'text-indigo-600' : 'text-slate-400'
                                    }`}
                                  />
                                  <div>
                                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                      <span>{ds.filename}</span>
                                      {isActive && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-600 text-white">
                                          ACTIVE
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-mono text-[10px] text-slate-400">
                                      {ds.id}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{new Date(ds.createdAt).toLocaleString()}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                <span className="font-bold text-slate-900">{ds.totalProcessed}</span> valid
                                <span className="text-slate-400 text-[10px] block">
                                  {ds.totalUploaded} total ({ds.duplicates} dups)
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                                  <Database className="w-3 h-3" />
                                  {ds.cacheHits}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                  {ds.aiCalls} calls
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-500 font-mono">
                                {(ds.durationMs / 1000).toFixed(1)}s
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  {isActive ? (
                                    <button
                                      onClick={() => setActiveSection('dashboard')}
                                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold transition-all inline-flex items-center gap-1"
                                    >
                                      <span>View in Dashboard</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        loadDataset(ds.id);
                                        setActiveSection('dashboard');
                                      }}
                                      className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold transition-all"
                                    >
                                      Switch to Dataset
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteDataset(ds.id)}
                                    title="Delete dataset"
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Execution Telemetry for current dataset */}
              {data && (
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
                        <span className="font-bold text-slate-900">Dataset Isolation</span>
                        <p>Every CSV upload receives a unique dataset ID. Cached AI results are safely reused without cross-contaminating reviews.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                    <p className="font-bold text-slate-900">Dataset Isolation Architecture</p>
                    <p>
                      Every uploaded CSV dataset is indexed by a unique <code className="font-mono text-indigo-600">dataset_id</code>. All review instances, ratings, and product feedback are strictly partitioned to ensure zero data leakage between different customer datasets.
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
                    <p>Google Gemini with temperature set to 0.1 for deterministic, factual outputs.</p>
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
