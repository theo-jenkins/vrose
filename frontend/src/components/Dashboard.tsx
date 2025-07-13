import React, { useEffect, useState } from 'react';
import api from "../services/api";
import DashboardFeature from './DashboardFeature';

interface DashboardFeatureType {
  key: string;
  title: string;
  route: string;
  icon?: string;
  enabled: boolean;
}

interface DashboardProps {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [features, setFeatures] = useState<DashboardFeatureType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get('/dashboard-features/');
        
        if (response.status === 200) {
          setFeatures(response.data.features || []);
          console.log('Features fetched successfully:', response.data.features);
        } else {
          setError('Failed to load dashboard features');
          console.error('Response status not 200:', response.data);
        }
      } catch (error: any) {
        setError('Error loading dashboard features');
        console.error('Error fetching features:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center p-4 bg-white dark:bg-[#161313]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-light-accent dark:border-dark-accent mb-4"></div>
          <p className="text-light-text dark:text-dark-text">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex items-center justify-center p-4 bg-white dark:bg-[#161313]">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-light-primary-button dark:bg-dark-primary-button text-light-button-text dark:text-dark-button-text rounded-md hover:scale-105 transition-transform duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (features.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center p-4 bg-white dark:bg-[#161313]">
        <div className="text-center">
          <p className="text-light-text dark:text-dark-text text-lg">No features available</p>
          <p className="text-gray-500 text-sm mt-2">Contact your administrator for access</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 bg-white dark:bg-[#161313]">
      {/* Welcome Message */}
      <div className="w-full max-w-4xl mb-8 text-center">
        <h1 className="text-3xl font-semibold text-light-text dark:text-dark-text mb-2">
          Welcome back, {user.first_name || user.email}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Choose a feature to get started
        </p>
      </div>

      {/* Features Grid - Vertical layout for better UX */}
      <div className="w-full max-w-2xl space-y-4">
        {features.map((feature) => (
          <DashboardFeature key={feature.key} feature={feature} />
        ))}
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-4xl mt-8 text-center">
        <p className="text-gray-500 text-sm">
          {features.filter(f => f.enabled).length} of {features.length} features available
        </p>
      </div>
    </div>
  );
};

export default Dashboard;