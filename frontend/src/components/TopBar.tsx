import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeSwitcher from './ThemeSwitcher';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useRouter } from 'next/router';
import { fetchCsrfToken, logout } from '../utils/auth';

const TopBar: React.FC = () => {
    const router = useRouter();
    const currentPage = router.pathname;
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const dispatch = useDispatch();
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    // Fetch user details and CSRF token on page load
    useEffect(() => {
        fetchCsrfToken();
      }, []);
    
    // Handle logout and redirect to home page
    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await logout(dispatch);
            router.push('/');
        } catch (err) {
            console.error('Logout failed:', err);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
            <div className="fixed top-0 left-0 w-full h-[10vh] font-custom bg-light-background dark:bg-dark-background shadow-md flex items-center">
                {/* Navigation Bar */}
                <nav className="flex items-center justify-between w-full h-full px-4">

                {/* Logo */}
                <div className="text-light-text dark:text-dark-text flex space-x-4 items-center">
                    <a href="/"><img src="/static/images/vrose-flower.svg" width={40} height={10} alt="Vrose Logo" /></a>
                    <Link href="/">VROSE</Link>
                </div>

                {/* Feature Links */}
                <div className="absolute left-1/2 transform -translate-x-1/2 flex space-x-8 font-serif:Avant-Garde text-light-text dark:text-dark-text">
                    <Link href="/" className="hover:scale-110 transition-all duration:300">Features</Link>
                    <Link href="/" className="hover:scale-110 transition-all duration:300">Pricing</Link>
                    <Link href="/" className="hover:scale-110 transition-all duration:300">Support</Link>
                </div>

                {/* Right-Side Controls */}
                <div className="flex items-center space-x-4 ml-auto">
                    {/* Theme Switcher */}
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
