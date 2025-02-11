import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

const DashboardButton: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated || !user) return null; // Don't render if not authenticated

  return (
    <Link href="/dashboard">
      <button className=" border-dark-background dark:border-dark-primary-button text-light-button-text dark:text-dark-text font-custom
                          px-2 py-1 rounded-md border-2
                          hover:scale-105 transition-all duration-300">
        Welcome back, {user.email}! Go to dashboard
      </button>
    </Link>
  );
};

export default DashboardButton;
