import React from 'react';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  LightBulbIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface SalesPredictionAnalysisProps {
  analysisResults: {
    analysis_type: string;
    status: string;
    summary: {
      method: string;
      model: string;
      confidence: number;
      prediction_horizon: string;
    };
    column_mappings: {
      datetime: string;
      sales: string;
      category?: string;
      promotion?: string;
    };
    key_findings: string[];
    predictions: {
      next_month_sales: number;
      growth_rate: number;
      seasonal_peak: string;
    };
    recommendations: string[];
    charts: Array<{
      type: string;
      title: string;
      description: string;
    }>;
  };
}

const SalesPredictionAnalysis: React.FC<SalesPredictionAnalysisProps> = ({ analysisResults }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-light-form-field dark:bg-dark-form-field rounded-lg border border-light-text/20 dark:border-dark-text/20 p-6">
        <div className="flex items-center mb-4">
          <ChartBarIcon className="h-6 w-6 text-light-primary-button dark:text-dark-primary-button mr-3" />
          <h2 className="text-lg font-semibold text-light-text dark:text-dark-text">
            Sales Prediction Analysis
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-light-text dark:text-dark-text">
              {analysisResults.summary.confidence}%
            </div>
            <div className="text-sm text-light-text dark:text-dark-text opacity-70">
              Model Confidence
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-light-text dark:text-dark-text">
              {analysisResults.summary.method}
            </div>
            <div className="text-sm text-light-text dark:text-dark-text opacity-70">
              Analysis Method
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-light-text dark:text-dark-text">
              {analysisResults.summary.prediction_horizon}
            </div>
            <div className="text-sm text-light-text dark:text-dark-text opacity-70">
              Forecast Horizon
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-light-form-field dark:bg-dark-form-field rounded-lg border border-light-text/20 dark:border-dark-text/20 p-6">
          <div className="flex items-center mb-3">
            <CurrencyDollarIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <h3 className="text-sm font-medium text-light-text dark:text-dark-text">
              Next Month Prediction
            </h3>
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(analysisResults.predictions.next_month_sales)}
          </div>
          <div className="text-sm text-light-text dark:text-dark-text opacity-70 mt-1">
            Predicted sales for next month
          </div>
        </div>

        <div className="bg-light-form-field dark:bg-dark-form-field rounded-lg border border-light-text/20 dark:border-dark-text/20 p-6">
          <div className="flex items-center mb-3">
            <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
            <h3 className="text-sm font-medium text-light-text dark:text-dark-text">
              Growth Rate
            </h3>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatPercentage(analysisResults.predictions.growth_rate)}
          </div>
          <div className="text-sm text-light-text dark:text-dark-text opacity-70 mt-1">
            Monthly growth trend
          </div>
        </div>

        <div className="bg-light-form-field dark:bg-dark-form-field rounded-lg border border-light-text/20 dark:border-dark-text/20 p-6">
          <div className="flex items-center mb-3">
            <CalendarDaysIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
            <h3 className="text-sm font-medium text-light-text dark:text-dark-text">
              Seasonal Peak
            </h3>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {analysisResults.predictions.seasonal_peak}
          </div>
          <div className="text-sm text-light-text dark:text-dark-text opacity-70 mt-1">
            Highest sales period
          </div>
        </div>
      </div>

      {/* Key Findings */}
      <div className="bg-light-form-field dark:bg-dark-form-field rounded-lg border border-light-text/20 dark:border-dark-text/20 p-6">
        <div className="flex items-center mb-4">
          <EyeIcon className="h-5 w-5 text-light-primary-button dark:text-dark-primary-button mr-2" />
          <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
            Key Findings
          </h3>
        </div>
        <div className="space-y-3">
          {analysisResults.key_findings.map((finding, index) => (
            <div key={index} className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span className="text-sm text-light-text dark:text-dark-text">
                {finding}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-light-form-field dark:bg-dark-form-field rounded-lg border border-light-text/20 dark:border-dark-text/20 p-6">
        <div className="flex items-center mb-4">
          <LightBulbIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
          <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
            Recommendations
          </h3>
        </div>
        <div className="space-y-3">
          {analysisResults.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span className="text-sm text-light-text dark:text-dark-text">
                {recommendation}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Data Mappings */}
      <div className="bg-light-form-field dark:bg-dark-form-field rounded-lg border border-light-text/20 dark:border-dark-text/20 p-6">
        <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4">
          Column Mappings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(analysisResults.column_mappings).map(([key, value]) => (
            value && (
              <div key={key} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-sm text-light-text dark:text-dark-text opacity-70 capitalize">
                  {key.replace('_', ' ')}:
                </span>
                <code className="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-light-text dark:text-dark-text">
                  {value}
                </code>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Available Charts */}
      <div className="bg-light-form-field dark:bg-dark-form-field rounded-lg border border-light-text/20 dark:border-dark-text/20 p-6">
        <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4">
          Available Visualizations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analysisResults.charts.map((chart, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-light-text dark:text-dark-text mb-2">
                {chart.title}
              </h4>
              <p className="text-xs text-light-text dark:text-dark-text opacity-70 mb-3">
                {chart.description}
              </p>
              <div className="bg-gray-100 dark:bg-gray-800 rounded h-24 flex items-center justify-center">
                <span className="text-sm text-light-text dark:text-dark-text opacity-50">
                  Coming Soon
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesPredictionAnalysis;