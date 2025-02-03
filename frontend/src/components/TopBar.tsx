import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeSwitcher from './ThemeSwitcher';
import { useRouter } from 'next/router';
import { fetchCsrfToken, logout } from '../utils/auth';

interface TopBarProps {
    isAuthenticated: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ isAuthenticated }) => {
    const router = useRouter();
    const currentPage = router.pathname;
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Fetch CSRF token on page load
    useEffect(() => {
        fetchCsrfToken();
      }, []);
    
    // Handle logout and redirect to home page
    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await logout();
            router.push('/');
        } catch (err) {
            console.error('Logout failed:', err);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
            <div className="fixed top-0 left-0 w-full h-[10vh] bg-light-background dark:bg-dark-background shadow-md flex items-center">
                {/* Navigation Bar */}
                <nav className="flex items-center justify-between w-full h-full px-8">

                {/* Logo */}
                <div className="flex space-x-8 items-center">
                    <Link href="/" className=" text-light-text dark:text-dark-text">VROSE</Link>
                </div>

                {/* Feature Links */}
                <div className="absolute left-1/2 transform -translate-x-1/2 flex space-x-8 text-light-text dark:text-dark-text">
                    <Link href="/" className="hover:scale-110 transition-all duration:300">Features</Link>
                    <Link href="/" className="hover:scale-110 transition-all duration:300">Pricing</Link>
                    <Link href="/" className="hover:scale-110 transition-all duration:300">Support</Link>
                </div>

                {/* Right-Side Controls */}
                <div className="flex items-center space-x-4 ml-auto">
                    <ThemeSwitcher />

                    {/* Authentication Buttons */}
                    {isAuthenticated ? (
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="border-2 border-light-button dark:border-dark-button text-light-button dark:text-dark-button font-semibold
                                                    px-2 py-1 rounded-md transition-all duration-300
                                                    hover:scale-110 hover:border-light-button dark:hover:border-dark-button-hover">
                            {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                        </button>
                    ) : (
                        <>
                            {currentPage !== '/auth/login' && (
                                <Link href="/auth/login">
                                    <button className="border-2 border-light-button dark:border-dark-button text-light-button dark:text-dark-button font-semibold
                                                    px-2 py-1 rounded-md transition-all duration-300
                                                    hover:scale-110 hover:border-light-button dark:hover:border-dark-button-hover">
                                        Login
                                    </button>
                                </Link>
                            )}
                            {currentPage !== '/auth/signup' && (
                                <Link href="/auth/signup">
                                    <button className="border-2 border-light-button dark:border-dark-button text-light-button dark:text-dark-button font-semibold
                                                    px-2 py-1 rounded-md transition-all duration-300
                                                    hover:scale-110 hover:border-light-button dark:hover:border-dark-button-hover">
                                    Sign Up
                                </button>
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </nav>
        </div>
    );
};

export default TopBar;
