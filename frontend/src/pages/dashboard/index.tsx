import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import TopBar from '@/components/TopBar';

const DashboardIndex: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated || !user) return null; // Don't render if not authenticated

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <TopBar />

      {/* Main Content: 2x2 Grid */}
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="grid grid-cols-2 grid-rows-2 gap-4 w-full max-w-4xl">
          <Link href="/dashboard" legacyBehavior>
            <a className="flex items-center justify-center rounded-lg bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text hover:scale-105 transition-all duration:300 p-8 text-xl font-semibold">
              Color scheme im happy with
            </a>
          </Link>
          <Link href="/dashboard" legacyBehavior>
            <a className="flex items-center justify-center rounded-lg bg-light-button dark:bg-dark-button text-light-button-text dark:text-dark-button-text hover:bg-light-button-hover dark:hover:bg-dark-button-hover p-8 text-xl font-semibold">
              Feature 2
            </a>
          </Link>
          <Link href="/dashboard" legacyBehavior>
            <a className="flex items-center justify-center rounded-lg bg-light-button dark:bg-dark-button text-light-button-text dark:text-dark-button-text hover:bg-light-button-hover dark:hover:bg-dark-button-hover p-8 text-xl font-semibold">
              Feature 3
            </a>
          </Link>
          <Link href="/dashboard" legacyBehavior>
            <a className="flex items-center justify-center rounded-lg bg-light-button dark:bg-dark-button text-light-button-text dark:text-dark-button-text hover:bg-light-button-hover dark:hover:bg-dark-button-hover p-8 text-xl font-semibold">
              Feature 4
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardIndex;
