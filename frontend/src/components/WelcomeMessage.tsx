import React from 'react';

const WelcomeMessage = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#191516]">
            <div className="bg-[#191516] text-[#F6D3E4] rounded-lg p-8 flex flex-col items-center">
                {/* Static Image */}
                <img
                    src="/static/images/vrose-logo.svg"
                    alt="Vrose Logo"
                    className="w-24 h-24 mb-4"
                />

                {/* Welcome Text */}
                <h1 className="text-3xl font-semibold text-center">
                    Welcome to Vrose
                </h1>
            </div>
        </div>
    );
};

export default WelcomeMessage;
