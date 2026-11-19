'use client';

import { useState } from 'react';
import type { DashboardData } from '@/types';
import Sidebar from '@/components/Sidebar';
import UploadSection from '@/components/UploadSection';
import SummaryCards from '@/components/SummaryCards';
import SentimentChart from '@/components/SentimentChart';
import TopFeedback from '@/components/TopFeedback';
import ReviewsTable from '@/components/ReviewsTable';
import ProcessingStats from '@/components/ProcessingStats';
import ProductAnalytics from '@/components/ProductAnalytics';
import EmptyState from '@/components/EmptyState';

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('dashboard');

  const handleUploadComplete = (dashboardData: DashboardData) => {
    setData(dashboardData);
    setActiveSection('dashboard');
  };

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        hasData={data !== null}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#1e293b]">
              {activeSection === 'upload'
                ? 'Upload Reviews'
                : activeSection === 'products'
                ? 'Product Analytics'
                : 'Dashboard'}
            </h1>
            <p className="text-[#64748b] mt-1">
              {activeSection === 'upload'
                ? 'Upload a CSV file to analyse customer reviews'
                : activeSection === 'products'
                ? 'Sentiment breakdown by product'
                : 'AI-powered insights from customer reviews'}
            </p>
          </div>

          {/* Upload Section */}
          {activeSection === 'upload' && (
            <UploadSection
              onUploadComplete={handleUploadComplete}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}

          {/* Dashboard */}
          {activeSection === 'dashboard' && (
            <>
              {!data ? (
                <EmptyState onUploadClick={() => setActiveSection('upload')} />
              ) : (
                <div className="space-y-6">
                  <SummaryCards summary={data.summary} />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SentimentChart summary={data.summary} />
                    <TopFeedback
                      complaints={data.topComplaints}
                      praises={data.topPraises}
                    />
                  </div>

                  <ProcessingStats stats={data.stats} />

                  <ReviewsTable reviews={data.reviews} />
                </div>
              )}
            </>
          )}

          {/* Product Analytics */}
          {activeSection === 'products' && (
            <>
              {!data ? (
                <EmptyState onUploadClick={() => setActiveSection('upload')} />
              ) : (
                <ProductAnalytics products={data.productAnalytics} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
