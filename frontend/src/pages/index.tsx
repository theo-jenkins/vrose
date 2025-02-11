import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import TopBar from '@/components/TopBar';
import WelcomeMessage from '@/components/WelcomeMessage';
import DashboardButton from '@/components/DashboardButton';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <div className="min-h-screen flex flex-col pt-[5vh] bg-white dark:bg-[#161313]">
      {/* Top Horizontal Bar (NavBar) */}
      <div className="h-[5vh] flex-shrink-0">
        <TopBar/>
      </div>

      {/* Dashboard button (only for authenticated users) */}
      {isAuthenticated && (
        <div className="flex justify-center items-center p-4">
          <DashboardButton/>
        </div>
      )}

      {/* Bottom Content Area (Welcome Message) */}
      <div className="flex-grow flex items-center justify-center p-4">
        <WelcomeMessage />
      </div>
    </div>
  );
};

export default HomePage;