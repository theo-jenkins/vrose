import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../services/api';
import DatasetWindow from '../components/DatasetWindow';
import InsightEngineStatus from '../components/InsightEngineStatus';
import SalesPredictionAnalysis from '../components/SalesPredictionAnalysis';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface DatasetInfo {
  id: string;
  dataset_name: string;
  file_size_mb: number;
  created_at: string;
  is_analysis_ready: boolean;
  validation_summary: any;
}

interface InsightAnalysis {
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  dataset_info: any;
  validation_summary: any;
  matched_methods: any[];
  selected_method: any;
  analysis_results: any;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

interface GenerateInsightsPageProps {
  datasetId?: string;
}

const GenerateInsightsPage: React.FC<GenerateInsightsPageProps> = ({ datasetId: propDatasetId }) => {
  const router = useRouter();
  const datasetId = propDatasetId || (router.query.datasetId as string);
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [insightAnalysis, setInsightAnalysis] = useState<InsightAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch dataset information
  useEffect(() => {
    const fetchDataset = async () => {
      if (!datasetId) return;

      try {
        const response = await api.get(`/features/analyse-data/${datasetId}/insights/status/`);
        if (response.data.success) {
          setDataset(response.data.dataset);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load dataset');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataset();
  }, [datasetId]);

  // Generate insights
  const handleGenerateInsights = async () => {
    if (!datasetId) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await api.post(`/features/analyse-data/${datasetId}/insights/generate/`);
      if (response.data.success) {
        setInsightAnalysis(response.data.insight_analysis);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate insights');
    } finally {
      setIsGenerating(false);
    }
  };

  // Redirect if no dataset ID
  if (!datasetId) {
    router.push('/features/analyse-data');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-background dark:bg-dark-background flex items-center justify-center">
        <div className="text-light-text dark:text-dark-text">Loading dataset...</div>
      </div>
    );
  }

  if (error && !dataset) {
    return (
      <div className="min-h-screen bg-light-background dark:bg-dark-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
          <button
            onClick={() => router.back()}
            className="text-light-primary-button dark:text-dark-primary-button hover:underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 text-light-text dark:text-dark-text hover:bg-light-form-field dark:hover:bg-dark-form-field rounded-md transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">
                Generate Insights
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {dataset?.dataset_name || 'Unknown Dataset'}
              </p>
            </div>
          </div>
          
          {/* Generate Insights Button */}
          {dataset?.is_analysis_ready && !insightAnalysis && (
            <button
              onClick={handleGenerateInsights}
              disabled={isGenerating}
              className="px-4 py-2 bg-light-primary-button dark:bg-dark-primary-button text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                'Generate Insights'
              )}
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="text-red-800 dark:text-red-200 text-sm">{error}</div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Dataset Info */}
          <div className="lg:col-span-1">
            {dataset && <DatasetWindow dataset={dataset} />}
          </div>

          {/* Right Column - Insight Engine */}
          <div className="lg:col-span-2 space-y-6">
            {/* Insight Engine Status */}
            <InsightEngineStatus 
              dataset={dataset}
              insightAnalysis={insightAnalysis}
              isGenerating={isGenerating}
              onGenerateInsights={handleGenerateInsights}
            />

            {/* Analysis Results */}
            {insightAnalysis?.analysis_results && (
              <SalesPredictionAnalysis 
                analysisResults={insightAnalysis.analysis_results}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateInsightsPage;