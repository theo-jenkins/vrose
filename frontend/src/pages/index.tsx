import React from 'react';
import AuthBar from '@/components/AuthBar';
import WelcomeMessage from '@/components/WelcomeMessage';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { parseCookies } from 'nookies';
import { jwtDecode } from 'jwt-decode'; // Optional

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
  const cookies = parseCookies(context);
  const refreshToken = cookies.refresh_token;

  let isAuthenticated = false;
  if (refreshToken) {
    try {
      const decodedToken = jwtDecode(refreshToken);
      isAuthenticated = !!decodedToken;
    } catch (error) {
      console.error('Invalid token:', error);
    }
  }

  return {
    props: { isAuthenticated },
  };
};

const HomePage: React.FC<{ isAuthenticated: boolean }> = ({ isAuthenticated }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="h-[10%]">
        <AuthBar isAuthenticated={isAuthenticated} currentPage="/" />
      </div>
      <div className="h-[90%] flex items-center justify-center p-4">
        <WelcomeMessage />
      </div>
    </div>
  );
};

export default HomePage;
