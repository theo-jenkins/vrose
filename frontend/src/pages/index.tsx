import React from 'react';
import AuthBar from '@/components/AuthBar';
import WelcomeMessage from '@/components/WelcomeMessage';
import { GetServerSidePropsContext } from 'next';
import { parseCookies } from 'nookies'

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { refresh_token } = parseCookies(context)
  const isAuthenticated = !!refresh_token

  return { props: { isAuthenticated } }
};

const HomePage: React.FC<{ isAuthenticated: boolean }> = ({ isAuthenticated }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="h-[10%]">
        <AuthBar isAuthenticated={isAuthenticated} />
      </div>
      <div className="h-[90%] flex items-center justify-center p-4">
        <WelcomeMessage />
      </div>
    </div>
  );
};

export default HomePage;
