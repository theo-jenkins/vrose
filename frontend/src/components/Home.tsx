import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../services/api';

interface UserType {
  email: string;
  permissions: string[];
}

const Home: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        // Make a GET request to your user-details endpoint
        const response = await api.get('/user-details/');
        setUser(response.data);
      } catch (err: any) {
        // Handle errors (unauthenticated, server error, etc.)
        setError('Not authenticated or server error.');
        // Optional: redirect to login if user not authenticated
        // router.push('/auth/login');
      }
    };

    fetchUserDetails();
  }, []);

  // Show error or loading states as needed
  if (error) return <p>{error}</p>;
  if (!user) return <p>Loading...</p>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#191516] text-[#F6D3E4]">
      <h1 className="text-3xl mb-4">Welcome, {user.email}</h1>
      <p>Your permissions:</p>
      <ul className="list-disc list-inside mt-2">
        {user.permissions.map((perm) => (
          <li key={perm}>{perm}</li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
