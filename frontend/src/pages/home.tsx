import React from 'react';
import TopBar from '@/components/TopBar';
import Home from '@/components/Home';

const HomePage: React.FC = () => {
    return (
        <div>
            <TopBar isAuthenticated={isAuthenticated} />
            <Home />
        </div>
    );
};

export default HomePage;
