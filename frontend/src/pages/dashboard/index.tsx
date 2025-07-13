import React from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { RootState } from '../../../redux/store';
import TopBar from '@/components/TopBar';
import Dashboard from '@/components/Dashboard';

const DashboardIndex: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  // Redirect to signin if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, router]);

  // Don't render anything if not authenticated or user data is missing
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <div className="flex-grow flex items-center justify-center bg-white dark:bg-[#161313]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-light-accent dark:border-dark-accent mb-4"></div>
            <p className="text-light-text dark:text-dark-text">Redirecting to signin...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <TopBar />

      {/* Main Dashboard Content */}
      <Dashboard user={user} />
    </div>
  );
};

export default DashboardIndex;
