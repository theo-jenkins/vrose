import React, { useState, useEffect, useCallback } from 'react';
import ImportProgressWidget from './ImportProgressWidget';

interface ImportProgressManager {
  addImport: (taskId: string) => void;
  removeImport: (taskId: string) => void;
  getActiveImports: () => string[];
}

// Global state for managing active imports
let activeImports: Set<string> = new Set();
let progressManagerInstance: ImportProgressManager | null = null;

export const useImportProgressManager = (): ImportProgressManager => {
  const [, forceUpdate] = useState({});

  const addImport = useCallback((taskId: string) => {
    activeImports.add(taskId);
    forceUpdate({});
  }, []);

  const removeImport = useCallback((taskId: string) => {
    activeImports.delete(taskId);
    forceUpdate({});
  }, []);

  const getActiveImports = useCallback(() => {
    return Array.from(activeImports);
  }, []);

  // Create a stable instance
  const manager = useCallback(() => ({ addImport, removeImport, getActiveImports }), [addImport, removeImport, getActiveImports]);

  // Store the instance for global access
  progressManagerInstance = manager();

  return progressManagerInstance;
};

// Global functions to add/remove imports from anywhere in the app
export const addGlobalImport = (taskId: string) => {
  if (progressManagerInstance) {
    progressManagerInstance.addImport(taskId);
  } else {
    activeImports.add(taskId);
  }
};

export const removeGlobalImport = (taskId: string) => {
  if (progressManagerInstance) {
    progressManagerInstance.removeImport(taskId);
  } else {
    activeImports.delete(taskId);
  }
};


const GlobalImportProgress: React.FC = () => {
  const progressManager = useImportProgressManager();
  const [activeImportsList, setActiveImportsList] = useState<string[]>([]);

  useEffect(() => {
    const updateList = () => {
      setActiveImportsList(Array.from(activeImports));
    };
    
    updateList();
    
    // Set up a simple interval to check for updates instead of relying on callbacks
    const interval = setInterval(updateList, 1000);
    
    return () => clearInterval(interval);
  }, []); // Empty dependency array

  const handleImportComplete = useCallback((taskId: string) => {
    activeImports.delete(taskId);
    setActiveImportsList(Array.from(activeImports));
  }, []);

  const handleImportError = useCallback((taskId: string, error: string) => {
    // Keep the widget visible for errors so user can see what went wrong
  }, []);

  return (
    <>
      {activeImportsList.map((taskId, index) => (
        <div 
          key={taskId}
          style={{ 
            bottom: `${20 + (index * 120)}px`,
            right: '16px'
          }}
          className="fixed z-[9999]"
        >
          <ImportProgressWidget
            taskId={taskId}
            onComplete={handleImportComplete}
            onError={handleImportError}
          />
        </div>
      ))}
    </>
  );
};

export default GlobalImportProgress;