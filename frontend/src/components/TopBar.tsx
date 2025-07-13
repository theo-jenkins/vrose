import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeSwitcher from './ThemeSwitcher';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useRouter } from 'next/router';
import { logout } from '../utils/auth';

const TopBar: React.FC = () => {
    const router = useRouter();
    const currentPage = router.pathname;
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const dispatch = useDispatch();
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    
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
            <div className="fixed top-0 left-0 w-full h-16 bg-light-background dark:bg-dark-background font-custom shadow-md flex items-center z-50">
                {/* Navigation Bar */}
                <nav className="flex items-center justify-between w-full h-full px-4">

                {/* Logo */}
                <div className="text-light-text dark:text-dark-text flex space-x-4 items-center">
                    <a href="/"><img src="/static/images/vrose-flower.svg" width={40} height={10} alt="Vrose Logo" /></a>
                    <Link href="/">VROSE</Link>
                </div>

                {/* Feature Links */}
                <div className="absolute left-1/2 transform -translate-x-1/2 flex space-x-8 text-light-text dark:text-dark-text">
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
                            className="font-semibold shadow-custom-light dark:shadow-custom-dark
                                        text-light-text dark:text-dark-text px-2 py-1 rounded-md 
                                        hover:scale-110 transition-all duration-300">
                            {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                        </button>
                    ) : (
                        <>
                            {currentPage !== '/auth/signin' && (
                                <Link href="/auth/signin">
                                    <button className="font-semibold shadow-custom-light dark:shadow-custom-dark
                                                    text-light-text dark:text-dark-text px-2 py-1 rounded-md 
                                                    hover:scale-110 transition-all duration-300">
                                        Sign In
                                    </button>
                                </Link>
                            )}
                            {currentPage !== '/auth/signup' && (
                                <Link href="/auth/signup">
                                    <button className="bg-light-primary-button dark:bg-dark-primary-button
                                                    text-light-button-text dark:text-dark-button-text font-semibold px-2 py-1 rounded-md
                                                    hover:scale-110 transition-all duration-300">
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
