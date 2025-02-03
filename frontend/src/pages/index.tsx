import React from 'react';
import TopBar from '@/components/TopBar';
import WelcomeMessage from '@/components/WelcomeMessage';
import DashboardButton from '@/components/DashboardButton';
import { GetServerSidePropsContext } from 'next';
import { parseCookies } from 'nookies'

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { refresh_token } = parseCookies(context)
  const isAuthenticated = !!refresh_token

  return { props: { isAuthenticated } }
};

const HomePage: React.FC<{ isAuthenticated: boolean }> = ({ isAuthenticated }) => {
  return (
    <div className="min-h-screen flex flex-col pt-[5vh]">
      {/* Top Horizontal Bar (NavBar) */}
      <div className="h-[5vh] flex-shrink-0">
        <TopBar isAuthenticated={isAuthenticated} />
      </div>

      {/* Dashboard button (only for authenticated users) */}
      {isAuthenticated && (
        <div className="flex justify-center items-center p-4">
          <DashboardButton isAuthenticated={isAuthenticated} />
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