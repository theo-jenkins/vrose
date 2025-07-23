import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import Image from 'next/image';
import TopBar from '../../components/TopBar';
import SavedTablesGrid from '../../components/SavedTablesGrid';
import { DatasetAnalysisMetadata, analyseDataService } from '../../services/analyseDataService';
import { RootState } from '../../../redux/store';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const AnalyseDataPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);
  const [savedTables, setSavedTables] = useState<DatasetAnalysisMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedTables();
    }
  }, [isAuthenticated]);

  const fetchSavedTables = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching saved tables...');
      
      const data = await analyseDataService.getDatasets();
      console.log('API Response:', data);
      console.log('Number of tables:', data.saved_tables?.length || 0);
      
      setSavedTables(data.saved_tables || []);
    } catch (err: any) {
      console.error('Error fetching saved tables:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to load saved tables. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTableDeleted = (tableId: string) => {
    setSavedTables(prev => prev.filter(table => table.id !== tableId));
  };

  const handleGenerateInsights = (tableId: string) => {
    router.push(`/features/analyse-data/${tableId}/insights`);
  };

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-light-background dark:bg-dark-background">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-light-accent dark:border-dark-accent"></div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-light-background dark:bg-dark-background">
        <TopBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-light-accent dark:border-dark-accent mx-auto"></div>
            <p className="mt-4 text-light-text dark:text-dark-text opacity-80">Loading your saved tables...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-light-background dark:bg-dark-background">
        <TopBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-light-error dark:text-dark-error mx-auto" />
            <h2 className="mt-4 text-xl font-semibold text-light-text dark:text-dark-text">Error Loading Tables</h2>
            <p className="mt-2 text-light-text dark:text-dark-text opacity-80">{error}</p>
            <button
              onClick={fetchSavedTables}
              className="mt-4 inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg bg-light-primary-button dark:bg-dark-primary-button text-light-button-text dark:text-dark-button-text hover:bg-light-button-hover dark:hover:bg-dark-button-hover hover:text-light-button-text-hover dark:hover:text-dark-button-text-hover transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      <TopBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center">
            <div>
              <h1 className="text-3xl font-bold text-light-text dark:text-dark-text">Analyse Data</h1>
              <p className="mt-2 text-light-text dark:text-dark-text opacity-80">
                Analyse your uploaded data tables and generate insights
              </p>
              <p className="mt-2 text-light-text dark:text-dark-text opacity-80">
                Order data with valid headers are eligible for AI analysis.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {savedTables.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Image
                src="/static/icons/analyse-data.svg"
                alt="Analyse Data"
                width={64}
                height={64}
                className="w-16 h-16 opacity-40"
              />
            </div>
            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-2">No Tables to Analyse</h2>
            <p className="text-light-text dark:text-dark-text opacity-80 mb-6">
              Upload and import some data first to start analysing your tables.
            </p>
            <button
              onClick={() => router.push('/features/upload-file')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg bg-light-primary-button dark:bg-dark-primary-button text-light-button-text dark:text-dark-button-text hover:bg-light-button-hover dark:hover:bg-dark-button-hover hover:text-light-button-text-hover dark:hover:text-dark-button-text-hover transition-all duration-300"
            >
              Upload Data
            </button>
          </div>
        ) : (
          <SavedTablesGrid
            tables={savedTables}
            onTableDeleted={handleTableDeleted}
            onGenerateInsights={handleGenerateInsights}
          />
        )}
      </div>
    </div>
  );
};

export default AnalyseDataPage;