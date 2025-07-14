import React, { useState, useEffect } from 'react';
import { TableAnalysisMetadata, analyseDataService } from '../services/analyseDataService';
import { TableCellsIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface TablePreviewProps {
  table: TableAnalysisMetadata;
}

const TablePreview: React.FC<TablePreviewProps> = ({ table }) => {
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreviewData();
  }, [table.id]);

  const fetchPreviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await analyseDataService.getTablePreview(table.id, 5);
      setPreviewData(response.preview_data);
      setColumns(response.columns);
      setTotalRows(response.total_rows);
    } catch (err) {
      console.error('Error fetching preview data:', err);
      setError('Failed to load preview data');
    } finally {
      setLoading(false);
    }
  };

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    
    const strValue = String(value);
    
    // Truncate very long strings
    if (strValue.length > 50) {
      return (
        <span title={strValue}>
          {strValue.substring(0, 47)}...
        </span>
      );
    }
    
    return strValue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-light-accent dark:border-dark-accent"></div>
        <span className="ml-2 text-sm text-light-text dark:text-dark-text opacity-80">Loading preview...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-light-error dark:text-dark-error">
        <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (previewData.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-light-text dark:text-dark-text opacity-80">
        <TableCellsIcon className="h-5 w-5 mr-2" />
        <span className="text-sm">No preview data available</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-light-text dark:text-dark-text">
          <TableCellsIcon className="h-5 w-5 mr-2" />
          <span className="text-sm font-medium">Table Preview</span>
        </div>
        <div className="text-xs text-light-text dark:text-dark-text opacity-80">
          {columns.length} columns • {totalRows.toLocaleString()} total rows
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border border-light-text/20 dark:border-dark-text/20 rounded-lg">
          <thead className="bg-light-background dark:bg-dark-background">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-3 py-2 text-left text-xs font-medium text-light-text dark:text-dark-text opacity-80 uppercase tracking-wider border-b border-light-text/20 dark:border-dark-text/20"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-light-form-field dark:bg-dark-form-field divide-y divide-light-text/20 dark:divide-dark-text/20">
            {previewData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-light-background dark:hover:bg-dark-background">
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-3 py-2 text-sm text-light-text dark:text-dark-text border-b border-light-text/20 dark:border-dark-text/20 max-w-xs truncate"
                  >
                    {formatCellValue(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="text-xs text-light-text dark:text-dark-text opacity-80 flex justify-between items-center">
        <span>Showing first {previewData.length} rows</span>
        <button
          onClick={fetchPreviewData}
          className="text-light-accent dark:text-dark-accent hover:text-light-accent/80 dark:hover:text-dark-accent/80 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default TablePreview;