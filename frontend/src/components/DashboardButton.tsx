import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

const DashboardButton: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated || !user) return null; // Don't render if not authenticated

  return (
    <Link href="/dashboard">
      <button className="border-2 border-light-button text-light-button font-custom
                          px-2 py-1 rounded-md transition-all duration-300
                          hover:scale-105 hover:border-light-button dark:hover:border-dark-button-hover">
        Welcome back, {user.email}! Go to dashboard
      </button>
    </Link>
  );
};

export default DashboardButton;
