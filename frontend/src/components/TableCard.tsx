import React, { useState } from 'react';
import { TableAnalysisMetadata } from '../services/analyseDataService';
import TableActions from './TableActions';
import HeaderValidationStatus from './HeaderValidationStatus';
import TablePreview from './TablePreview';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  DocumentIcon,
  CalendarIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';

interface TableCardProps {
  table: TableAnalysisMetadata;
  onDeleted: (tableId: string) => void;
  onGenerateInsights: (tableId: string) => void;
}

const TableCard: React.FC<TableCardProps> = ({
  table,
  onDeleted,
  onGenerateInsights,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationData, setValidationData] = useState(table.validation_summary);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleValidationUpdate = (newValidationData: any) => {
    setValidationData(newValidationData);
  };

  return (
    <div className="bg-light-form-field dark:bg-dark-form-field rounded-lg border border-light-text/20 dark:border-dark-text/20 hover:border-light-text/40 dark:hover:border-dark-text/40 transition-all duration-200">
      {/* Main horizontal layout */}
      <div className="flex items-center justify-between p-6">
        {/* Left side - Table metadata */}
        <div className="flex items-center space-x-6 flex-1">
          {/* Expand/Collapse button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-2 text-light-text dark:text-dark-text hover:bg-light-background dark:hover:bg-dark-background rounded-md transition-colors"
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>

          {/* Table info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2 truncate">
              {table.display_name}
            </h3>
            
            {/* Metadata row */}
            <div className="flex items-center space-x-6 text-sm text-light-text dark:text-dark-text opacity-80">
              <div className="flex items-center">
                <DocumentIcon className="h-4 w-4 mr-1" />
                <span>{table.file_size_mb} MB</span>
              </div>
              <div className="flex items-center">
                <CircleStackIcon className="h-4 w-4 mr-1" />
                <span>{table.row_count.toLocaleString()} rows</span>
              </div>
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                <span>{formatDate(table.created_at)}</span>
              </div>
            </div>

            {/* Validation status */}
            <div className="mt-3">
              <HeaderValidationStatus
                table={table}
                validationData={validationData}
                isValidating={isValidating}
                onValidationUpdate={handleValidationUpdate}
                onValidatingChange={setIsValidating}
              />
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex-shrink-0 ml-6">
          <TableActions
            table={table}
            validationData={validationData}
            isValidating={isValidating}
            onDeleted={onDeleted}
            onGenerateInsights={onGenerateInsights}
          />
        </div>
      </div>

      {/* Expandable table preview */}
      {isExpanded && (
        <div className="border-t border-light-text/20 dark:border-dark-text/20 px-6 py-4">
          <TablePreview table={table} />
        </div>
      )}
    </div>
  );
};

export default TableCard;