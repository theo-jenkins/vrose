import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import TopBar from '@/components/TopBar';
import { analyseDataService } from '@/services/analyseDataService';
import { RootState } from '../../../../../redux/store';
import { ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const InsightsPage: React.FC = () => {
  const router = useRouter();
  const { datasetId } = router.query;
  const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [table, setTable] = useState<any>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (datasetId && typeof datasetId === 'string') {
      fetchTableData();
    }
  }, [datasetId]);

  const fetchTableData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tableData = await analyseDataService.getDatasetAnalysisDetail(datasetId as string);
      setTable(tableData);
    } catch (err) {
      console.error('Error fetching table data:', err);
      setError('Failed to load table data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading insights...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Error Loading Insights</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <div className="mt-6 space-x-3">
              <button
                onClick={fetchTableData}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/features/analyse-data')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Tables
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {table?.dataset_name} - Insights
                </h1>
                <p className="mt-2 text-gray-600">
                  Data analysis and insights for your table
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/features/analyse-data')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Tables
            </button>
          </div>
        </div>

        {/* Insights Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center py-12">
            <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Insights Coming Soon
            </h2>
            <p className="text-gray-600 mb-6">
              This feature is currently under development. Soon you'll be able to view:
            </p>
            <div className="text-left max-w-md mx-auto space-y-2">
              <div className="flex items-center text-gray-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Sales trends and patterns
              </div>
              <div className="flex items-center text-gray-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Top performing products
              </div>
              <div className="flex items-center text-gray-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Revenue analysis
              </div>
              <div className="flex items-center text-gray-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Interactive charts and graphs
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;