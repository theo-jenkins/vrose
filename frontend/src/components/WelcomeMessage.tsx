import React from 'react';

const WelcomeMessage = () => {
    return (
        <div className="flex-grow flex items-center justify-center rounded-md bg-light-background dark:bg-dark-background px-8 shadow-lg">
            <div className="w-full max-w-4xl text-light-text dark:text-dark-text rounded-2xl p-8 flex flex-col items-center">
                {/* Static Image */}
                <img
                    src="/static/images/vrose-logo.svg"
                    alt="Vrose Logo"
                    className="w-24 h-24 mb-4"
                />

                {/* Welcome Text */}
                <h1 className="text-3xl font-semibold text-center">
                    Welcome to VROSE
                </h1>
            </div>
        </div>
    );
};

export default WelcomeMessage;
