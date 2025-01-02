// /pages/index.tsx
import React from 'react';
import Link from 'next/link';

const HomePage = () => {
    return (
        <div>
            <h1>Home Page</h1>
            <Link href="/register">Register</Link>
            <Link href="/login">Login</Link>
        </div>
    );
};

export default HomePage;