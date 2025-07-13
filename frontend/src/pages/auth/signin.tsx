import React from 'react';
import TopBar from '@/components/TopBar';
import SignInContainer from '@/components/SignInContainer';

const SignInPage: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#161313]">
            <TopBar />
            <SignInContainer />
        </div>
    );
};

export default SignInPage;