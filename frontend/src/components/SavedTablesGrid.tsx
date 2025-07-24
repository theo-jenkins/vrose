import React from 'react';
import TableCard from './TableCard';
import { DatasetAnalysisMetadata } from '../services/analyseDataService';

interface SavedTablesGridProps {
  datasets: DatasetAnalysisMetadata[];
  onTableDeleted: (tableId: string) => void;
  onGenerateInsights: (tableId: string) => void;
}

const SavedTablesGrid: React.FC<SavedTablesGridProps> = ({
  datasets,
  onTableDeleted,
  onGenerateInsights,
}) => {
  return (
    <div className="space-y-6">
      {datasets.filter(dataset => dataset && dataset.id).map((dataset) => (
        <TableCard
          key={dataset.id}
          dataset={dataset}
          onDeleted={onTableDeleted}
          onGenerateInsights={onGenerateInsights}
        />
      ))}
    </div>
  );
};

export default SavedTablesGrid;