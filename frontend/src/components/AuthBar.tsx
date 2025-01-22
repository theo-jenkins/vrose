import React from 'react';
import Link from 'next/link';
import { destroyCookie } from 'nookies';
import { useRouter } from 'next/router';

interface AuthBarProps {
    isAuthenticated: boolean;
    currentPage: string;
}

const AuthBar: React.FC<AuthBarProps> = ({ isAuthenticated, currentPage }) => {
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            // Call the logout API
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include', // Include cookies in the request
            });

            if (!response.ok) {
                console.error('Logout failed:', response.statusText);
                return;
            }

            // Destroy the refresh token cookie
            destroyCookie(null, 'refresh_token');

            // Redirect to home
            router.push('/');
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    return (
        <nav className="bg-[#191516] text-[#F6D3E4] py-4 px-6 flex justify-between items-center">
            {/* Navigation Buttons */}
            <div className="flex space-x-4">
                {isAuthenticated ? (
                    <button
                        className="bg-[#F6D3E4] text-[#191516] font-semibold rounded-md hover:bg-[#e9c0d4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F6D3E4]"
                        onClick={handleSignOut}
                    >
                        Sign Out
                    </button>
                ) : (
                    <>
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
