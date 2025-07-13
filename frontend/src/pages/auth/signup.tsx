import React from 'react';
import TopBar from '@/components/TopBar';
import SignUpContainer from '@/components/SignUpContainer';

const SignUpPage: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#161313]">
            <TopBar />
            <SignUpContainer />
        </div>
    );
};

export default SignUpPage;