import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from "../../services/api";
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import TopBar from '@/components/TopBar';

interface DashboardFeature {
  key: string;
  title: string;
  route: string;
  icon?: string; // Icon file name, e.g., "feature1.svg"
  enabled: boolean;
}

const DashboardIndex: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [features, setFeatures] = useState<DashboardFeature[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchFeatures = async () => {
      if (isAuthenticated && user) {
        try {
          // Call the API to fetch features
          const response = await api.get('/dashboard-features/');
          if (response.status === 200) {
            // Assuming the API returns { features: [...] }
            setFeatures(response.data.features);
            console.log('Features fetched successfully:', response.data.features);
          } else {
            console.error('Response status not 200:', response.data);
          }
        } catch (error) {
          console.error('Error fetching features:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchFeatures();
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <div className="flex-grow flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <TopBar />

      {/* Main Content: Grid of Feature Cards */}
      <div className="flex-grow flex items-center justify-center p-4 bg-white dark:bg-[#161313]">
        <div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
          {features.map((feature) =>
            feature.enabled ? (
              <Link key={feature.key} href={feature.route} legacyBehavior>
                <a className="flex flex-col items-center justify-center rounded-lg bg-light-primary-button dark:bg-dark-primary-button text-light-button-text dark:text-dark-button-text hover:scale-105 transition-transform duration-300 p-8 text-xl font-semibold">
                  {/* Render the feature icon if available */}
                  {feature.icon && (
                    <img
                      src={`/static/icons/${feature.icon}`}
                      alt={feature.title}
                      className="w-8 h-8 mb-2"
                    />
                  )}
                  <span>{feature.title}</span>
                </a>
              </Link>
            ) : (
              // Render disabled (greyed-out) card with lock icon
              <div
                key={feature.key}
                className="flex flex-col items-center justify-center rounded-lg bg-gray-300 text-gray-600 p-8 text-xl font-semibold opacity-50 cursor-not-allowed"
              >
                <img
                  src="/static/icon/lock-closed.svg"
                  alt="Locked"
                  className="w-8 h-8 mb-2"
                />
                <span>{feature.title}</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardIndex;
