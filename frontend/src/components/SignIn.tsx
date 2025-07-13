import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { fetchCsrfToken, handleSignIn } from '../utils/auth';

const SignIn: React.FC = () => {
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
      const response = await handleSignIn(credentials, dispatch);
      if (response.status === 200) {
        router.push("/");
      }
    } catch (err) {
      console.error("SignIn failed:", err);
      setError("Failed to authenticate");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
  );
};

export default SignIn;
