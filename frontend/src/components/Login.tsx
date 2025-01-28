import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { login } from '../utils/auth';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await login(credentials);
      if (response.status === 200) {
        console.log('Login successful:', response.data);
        router.push('/home'); // Redirect to users home page
      } else {
        setError(response.data.detail || 'Login failed');
      }
    } catch (err: any) {
      // Handle network or server errors
      const errorMessage = err.response?.data?.detail || 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Login failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#191516]">
      <div className="w-full max-w-md bg-[#191516] text-[#F6D3E4] rounded-lg p-8 hover:shadow-[0_0_10px_#F6D3E4] transition-shadow duration-300">
        <h2 className="text-3xl font-semibold text-center mb-6">Sign In</h2>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-[#2D282A] text-[#F6D3E4] focus:outline-none focus:ring-2 focus:ring-[#F6D3E4]"
              placeholder="Enter your email"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-[#2D282A] text-[#F6D3E4] focus:outline-none focus:ring-2 focus:ring-[#F6D3E4]"
              placeholder="Enter your password"
            />
          </div>

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-[#F6D3E4] text-[#191516] font-semibold rounded-md hover:bg-[#e9c0d4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F6D3E4]"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
