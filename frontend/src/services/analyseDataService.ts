import api from './api';

export interface TableAnalysisMetadata {
  id: string;
  display_name: string;
  file_path: string;
  file_size: number;
  file_size_mb: number;
  row_count: number;
  headers: string[];
  is_validated: boolean;
  validation_completed_at: string | null;
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
  async getSavedTables(): Promise<{ saved_tables: TableAnalysisMetadata[]; total_count: number }> {
    try {
      const response = await api.get('/features/analyse-data/');
      return response.data;
    } catch (error) {
      console.error('Error fetching table analysis metadata:', error);
      throw error;
    }
  }

  async getSavedTableDetail(tableId: string): Promise<TableAnalysisMetadata> {
    try {
      const response = await api.get(`/features/analyse-data/${tableId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching table analysis metadata detail:', error);
      throw error;
    }
  }

  async deleteSavedTable(tableId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/features/analyse-data/${tableId}/delete/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting table analysis metadata:', error);
      throw error;
    }
  }

  async validateHeaders(
    tableId: string,
    options: HeaderValidationRequest = {}
  ): Promise<HeaderValidationResponse> {
    try {
      const response = await api.post(
        `/features/analyse-data/${tableId}/validate-headers/`,
        options
      );
      return response.data;
    } catch (error) {
      console.error('Error validating headers:', error);
      throw error;
    }
  }

  async generateInsights(tableId: string): Promise<{ message: string; table_id: string; redirect_url: string }> {
    try {
      const response = await api.post(
        `/features/analyse-data/${tableId}/generate-insights/`,
        {}
      );
      return response.data;
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  }

  async createSavedTable(dataTableId: string): Promise<{ message: string; table_analysis_metadata: TableAnalysisMetadata }> {
    try {
      const response = await api.post(
        '/features/analyse-data/create/',
        { data_table_id: dataTableId }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating table analysis metadata:', error);
      throw error;
    }
  }

  // Helper method to get table preview data
  async getTablePreview(tableId: string, limit: number = 5): Promise<{
    preview_data: any[];
    columns: string[];
    total_rows: number;
  }> {
    try {
      const response = await api.get(
        `/features/analyse-data/${tableId}/preview/`,
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching table preview:', error);
      throw error;
    }
  }
}

export const analyseDataService = new AnalyseDataService();