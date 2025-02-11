import React from 'react';
import TopBar from '@/components/TopBar';
import SignUp from '@/components/SignUp';

const SignUpPage: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#161313]">
            <TopBar />
            <SignUp />
        </div>
    );
};

export default SignUpPage;