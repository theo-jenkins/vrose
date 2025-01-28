import React, { useState } from 'react';
import Link from 'next/link';
import ThemeSwitcher from './ThemeSwitcher';
import { useRouter } from 'next/router';
import { logout } from '../utils/auth';

interface AuthBarProps {
    isAuthenticated: boolean;
}

const AuthBar: React.FC<AuthBarProps> = ({ isAuthenticated }) => {
    const router = useRouter();
    const currentPage = router.pathname;
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            const response = await logout();
            console.log('Logout success:', response.data);
            router.push('/');
        }   catch (err) {
        console.error('Logout failed:', err);
    }   finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <nav className="bg-[#191516] text-[#F6D3E4] py-4 px-6 flex justify-between items-center">
        <div className="flex space-x-4">
            {/* Add theme switcher here */}
            <ThemeSwitcher />

            {/* Add logout button here */}
            {isAuthenticated ? (
            <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-[#F6D3E4] text-[#191516] font-semibold rounded-md hover:bg-[#e9c0d4]
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F6D3E4]"
            >
                {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
            </button>
            ) : (
            <>
                {/* Add login and signup buttons here */}
                {currentPage !== '/auth/login' && (
                <Link href="/auth/login">
                    <button className="bg-[#F6D3E4] text-[#191516] font-semibold rounded-md hover:bg-[#e9c0d4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F6D3E4]">
                        Login
                    </button>
                </Link>
                )}
                {currentPage !== '/auth/signup' && (
                <Link href="/auth/signup">
                    <button className="bg-[#F6D3E4] text-[#191516] font-semibold rounded-md hover:bg-[#e9c0d4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F6D3E4]">
                        Sign Up
                    </button>
                </Link>
                )}
            </>
            )}
        </div>
        </nav>
    );
};

export default AuthBar;
