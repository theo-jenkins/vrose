import api from './api';

export interface DatasetAnalysisMetadata {
  id: string;
  dataset_id: string;
  dataset_name: string;
  file_size_mb: number;
  is_analysis_ready: boolean;
  analysis_validated_at: string | null;
  required_columns_found: Record<string, any>;
  optional_columns_found: Record<string, any>;
  insights_generated: boolean;
  last_analysis_run: string | null;
  created_at: string;
  updated_at: string;
  header_validations: HeaderValidation[];
  validation_summary: ValidationSummary | null;
}

export interface HeaderValidation {
  id: string;
  header_type: string;
  matched_column: string | null;
  confidence_score: number | null;
  is_found: boolean;
  validation_method: string;
  created_at: string;
}

export interface ValidationSummary {
  all_found: boolean;
  found_count: number;
  total_count: number;
  can_generate_insights: boolean;
  missing_headers: string[];
}

export interface HeaderValidationRequest {
  force_revalidate?: boolean;
}

export interface HeaderValidationResponse {
  success: boolean;
  message: string;
  validation_results: Record<string, any>;
  validation_summary: ValidationSummary;
}

class AnalyseDataService {
  async getDatasets(): Promise<{ saved_tables: DatasetAnalysisMetadata[]; total_count: number }> {
    try {
      const response = await api.get('/features/analyse-data/');
      return response.data;
    } catch (error) {
      console.error('Error fetching datasets for analysis:', error);
      throw error;
    }
  }

  async getDatasetAnalysisDetail(datasetId: string): Promise<DatasetAnalysisMetadata> {
    try {
      const response = await api.get(`/features/analyse-data/${datasetId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dataset analysis metadata detail:', error);
      throw error;
    }
  }

  async deleteDataset(datasetId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/features/analyse-data/${datasetId}/delete/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting dataset:', error);
      throw error;
    }
  }

  async validateHeaders(
    datasetId: string,
    options: HeaderValidationRequest = {}
  ): Promise<HeaderValidationResponse> {
    try {
      const response = await api.post(
        `/features/analyse-data/${datasetId}/validate-headers/`,
        options
      );
      return response.data;
    } catch (error) {
      console.error('Error validating headers:', error);
      throw error;
    }
  }

  async generateInsights(datasetId: string): Promise<{ message: string; dataset_id: string; redirect_url: string }> {
    try {
      const response = await api.post(
        `/features/analyse-data/${datasetId}/generate-insights/`,
        {}
      );
      return response.data;
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  }

  // Get dataset preview data
  async getDatasetPreview(datasetId: string, limit: number = 5): Promise<{
    preview_data: any[];
    columns: string[];
    total_rows: number;
    dataset_name: string;
  }> {
    try {
      const response = await api.get(
        `/features/analyse-data/${datasetId}/preview/`,
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching dataset preview:', error);
      throw error;
    }
  }
}

export const analyseDataService = new AnalyseDataService();