import React from 'react';
import TopBar from '@/components/TopBar';
import Login from '@/components/Login';

const LoginPage: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#191516]">
            <TopBar />
            <Login />
        </div>
    );
};

export default LoginPage;