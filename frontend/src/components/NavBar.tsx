import React, { useState } from 'react';
import Link from 'next/link';
import ThemeSwitcher from './ThemeSwitcher';
import { useRouter } from 'next/router';
import { logout } from '../utils/auth';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface NavBarProps {
    isAuthenticated: boolean;
}

const NavBar: React.FC<NavBarProps> = ({ isAuthenticated }) => {
    const router = useRouter();
    const currentPage = router.pathname;
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isOpen, setIsOpen] = useState(true);

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
        <div className="fixed top-0 left-0 h-full flex">
            {/* Sidebar (Width is 10% of viewport) */}
            <motion.div
                className="h-full w-[15%] p-4 shadow-lg fixed top-0 left-0 z-50 flex flex-col justify-between 
                           bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text"
                initial={{ x: '0%' }}
                animate={{ x: isOpen ? '0%' : '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                {/* Top Section */}
                <div className="flex flex-col items-center space-y-6">
                    {/* Logo */}
                    <Link href="/">
                        <img src="/static/images/vrose-logo.svg" alt="Vrose Logo" className="w-16 h-16" />
                        <p className="text-center text-sm font-semibold">VROSE</p>
                    </Link>

                    {/* Divider */}
                    <hr className="w-full border-t border-light-accent dark:border-dark-accent opacity-50" />

                    {/* Feature Links */}
                    <nav className="flex flex-col space-y-4 w-full text-center">
                        <Link href="/home" className="hover:text-light-accent dark:hover:text-dark-accent">Order Analysis</Link>
                        <Link href="/home" className="hover:text-light-accent dark:hover:text-dark-accent">Stock Analysis</Link>
                        <Link href="/home" className="hover:text-light-accent dark:hover:text-dark-accent">Portfolio Analysis</Link>
                        <Link href="/home" className="hover:text-light-accent dark:hover:text-dark-accent">AI Chat</Link>
                    </nav>
                </div>

                {/* Bottom Section */}
                <div className="flex flex-col items-center space-y-6">
                    {/* Theme Switcher */}
                    <ThemeSwitcher />

                    {/* Authentication Buttons */}
                    {isAuthenticated ? (
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="w-full bg-light-button dark:bg-dark-button text-light-button-text dark:text-dark-button-text font-semibold 
                                       rounded-md hover:bg-light-button-hover dark:hover:bg-dark-button-hover focus:outline-none focus:ring-2 
                                       focus:ring-offset-2 focus:ring-light-accent dark:focus:ring-dark-accent"
                        >
                            {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                        </button>
                    ) : (
                        <>
                            {currentPage !== '/auth/login' && (
                                <Link href="/auth/login">
                                    <button className="w-full bg-light-button dark:bg-dark-button text-light-button-text dark:text-dark-button-text font-semibold 
                                                       rounded-md hover:bg-light-button-hover dark:hover:bg-dark-button-hover focus:outline-none focus:ring-2 
                                                       focus:ring-offset-2 focus:ring-light-accent dark:focus:ring-dark-accent"
                                    >
                                        Login
                                    </button>
                                </Link>
                            )}
                            {currentPage !== '/auth/signup' && (
                                <Link href="/auth/signup">
                                    <button className="w-full bg-light-button dark:bg-dark-button text-light-button-text dark:text-dark-button-text font-semibold 
                                                       rounded-md hover:bg-light-button-hover dark:hover:bg-dark-button-hover focus:outline-none focus:ring-2 
                                                       focus:ring-offset-2 focus:ring-light-accent dark:focus:ring-dark-accent"
                                    >
                                        Sign Up
                                    </button>
                                </Link>
                            )}
                        </>
                    )}
                </div>

                {/* Toggle Button (Moves relative to navbar width) */}
                <motion.button
                    className="absolute top-1/2 right-[-32px] bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text 
                            p-2 shadow-md rounded-l-md transition-all transform translate-x-full"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle Navigation"
                    initial={{ translateX: '0%' }}
                    animate={{ translateX: isOpen ? '0%' : '100%' }}  // Moves with navbar width
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </motion.button>
            </motion.div>

            
        </div>
    );
};

export default NavBar;
