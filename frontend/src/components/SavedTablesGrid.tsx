import React from 'react';
import TableCard from './TableCard';
import { TableAnalysisMetadata } from '../services/analyseDataService';

interface SavedTablesGridProps {
  tables: TableAnalysisMetadata[];
  onTableDeleted: (tableId: string) => void;
  onGenerateInsights: (tableId: string) => void;
}

const SavedTablesGrid: React.FC<SavedTablesGridProps> = ({
  tables,
  onTableDeleted,
  onGenerateInsights,
}) => {
  return (
    <div className="space-y-6">
      {tables.map((table) => (
        <TableCard
          key={table.id}
          table={table}
          onDeleted={onTableDeleted}
          onGenerateInsights={onGenerateInsights}
        />
      ))}
    </div>
  );
};

export default SavedTablesGrid;