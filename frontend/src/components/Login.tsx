import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { fetchCsrfToken, login } from '../utils/auth';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const dispatch = useDispatch();

  // Check for CSRF token
  useEffect(() => {
    fetchCsrfToken();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setError(""); // Clear error on input change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!credentials.email || !credentials.password) {
      setError("Email and password are required.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await login(credentials, dispatch);
      if (response.status === 200) {
        router.push("/");
      }
    } catch (err) {
      console.error("Login failed (2):", err);
      setError("Failed to authenticate");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#161313]">
      <div className="w-full max-w-md bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text shadow-custom-light dark:shadow-custom-dark rounded-lg p-8">
        <h2 className="text-3xl font-semibold text-center mb-6">Sign In</h2>

        {/* Divider */}
        <hr className="my-6 h-px border-0 bg-gradient-to-r from-transparent via-[#191516] dark:via-[#FCEEF5] to-transparent opacity-100" />

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
              className="w-full p-3 rounded-md bg-light-form-field dark:bg-dark-form-field shadow-custom-light"
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
              className="w-full p-3 rounded-md bg-light-form-field dark:bg-dark-form-field shadow-custom-light"
              placeholder="Enter your password"
            />
          </div>

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-light-primary-button dark:bg-dark-primary-button text-light-text dark:text-dark-text font-semibold rounded-md hover:scale-105 transition-transform duration-300"
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
