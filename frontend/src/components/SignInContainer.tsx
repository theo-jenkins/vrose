import React from 'react';
import SignIn from './SignIn';
import GoogleSignIn from './GoogleSignIn';

const SignInContainer: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text shadow-custom-light dark:shadow-custom-dark rounded-lg p-8">
        <h2 className="text-3xl font-semibold text-center mb-2">Sign In</h2>
        
        {/* Divider */}
        <hr className="my-6 h-px border-0 bg-gradient-to-r from-transparent via-[#191516] dark:via-[#FCEEF5] to-transparent opacity-100" />
        
        {/* Sign In Form */}
        <SignIn />
        
        {/* OR Divider */}
        <div className="relative mt-6 mb-6">
          <hr className="h-px border-0 bg-gradient-to-r from-transparent via-[#191516] dark:via-[#FCEEF5] to-transparent opacity-100" />
          <div className="absolute inset-0 flex justify-center">
            <span className="bg-light-background dark:bg-dark-background px-4 text-sm text-gray-500">
              OR
            </span>
          </div>
        </div>        

        {/* Google Sign In */}
        <div className="mb-6">
          <GoogleSignIn />
        </div>
        
      </div>
    </div>
  );
};

export default SignInContainer;