import React, { useState, useEffect } from 'react';
import { fetchUserDetails } from '../utils/auth';

interface DashboardButtonProps {
  isAuthenticated: boolean;
}

const DashboardButton: React.FC<DashboardButtonProps> = ({ isAuthenticated }) => {
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const getUserDetails = async () => {
      if (!isAuthenticated) return;
      try {
        const userDetails = await fetchUserDetails();
        setUser(userDetails); // Store user data in state
      } catch (err) {
        console.error('Error fetching user details:', err);
      }
    };
    getUserDetails();
  }, [isAuthenticated]);

  if (!user) return null; // Hide button if no user data

  return (
    <button className="border-2 border-light-button dark:border-dark-button text-light-button dark:text-dark-button font-semibold
                        px-2 py-1 rounded-md transition-all duration-300
                        hover:scale-105 hover:border-light-button dark:hover:border-dark-button-hover">
      Welcome back, {user.email}! Go to dashboard
    </button>
  );
};

export default DashboardButton;
