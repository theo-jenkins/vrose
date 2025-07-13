import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { handleGoogleSuccess } from '../utils/auth';

interface GoogleSignInProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const GoogleSignIn: React.FC<GoogleSignInProps> = ({ onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const onGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      await handleGoogleSuccess(credentialResponse, dispatch, router, onSuccess, onError);
    } catch (error) {
      // Error handling is already done in handleGoogleSuccess
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleError = () => {
    const errorMessage = 'Google authentication cancelled or failed';
    if (onError) {
      onError(errorMessage);
    } else {
      console.error('Google Sign In failed');
    }
  };

  // Get Google Client ID from environment
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  
  if (!googleClientId) {
    return (
      <div className="text-red-500 text-sm">
        Google OAuth not configured
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="relative w-full">
        <div className="w-full overflow-hidden rounded-md">
          <GoogleLogin
            onSuccess={onGoogleSuccess}
            onError={onGoogleError}
            useOneTap={false}
            theme="outline"
            size="large"
            width="100%"
            text="signin_with"
            shape="rectangular"
            disabled={isLoading}
          />
        </div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-75 rounded-md">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-light-accent dark:border-dark-accent"></div>
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
};

export default GoogleSignIn;