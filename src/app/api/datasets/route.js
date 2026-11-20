import { NextResponse } from 'next/server';
import { listDatasets, getDataset, getDatasetReviews, deleteDataset } from '@/services/cache-service';
import { aggregateAnalytics } from '@/services/analytics-service';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // If specific dataset ID requested, return complete isolated dashboard data
    if (id) {
      const dataset = getDataset(id);
      if (!dataset) {
        return NextResponse.json(
          { success: false, error: 'Dataset not found' },
          { status: 404 }
        );
      }

      const reviews = getDatasetReviews(id);

      const stats = {
        totalUploaded: dataset.totalUploaded,
        totalProcessed: dataset.totalProcessed,
        skipped: dataset.skipped,
        duplicates: dataset.duplicates,
        cacheHits: dataset.cacheHits,
        aiCalls: dataset.aiCalls,
        failed: dataset.failed,
        durationMs: dataset.durationMs,
      };

      const dashboardData = aggregateAnalytics(reviews, stats);

      return NextResponse.json({
        success: true,
        data: {
          ...dashboardData,
          dataset: {
            id: dataset.id,
            filename: dataset.filename,
            createdAt: dataset.createdAt,
          },
        },
      });
    }

    // Otherwise list all available datasets
    const datasets = listDatasets();
    return NextResponse.json({
      success: true,
      datasets,
    });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch datasets' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Dataset ID required' },
        { status: 400 }
      );
    }

    deleteDataset(id);
    return NextResponse.json({ success: true, message: `Dataset ${id} deleted` });
  } catch (error) {
    console.error('Error deleting dataset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete dataset' },
      { status: 500 }
    );
  }
}
