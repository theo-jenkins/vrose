import React from 'react';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#191516]">
      <div className="w-full max-w-md bg-[#191516] text-[#F6D3E4] rounded-lg p-8 hover:shadow-[0_0_10px_#F6D3E4] transition-shadow duration-300">
        <h2 className="text-3xl font-semibold text-center mb-6">Sign In</h2>
        <form className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full p-3 rounded-md bg-[#2D282A] text-[#F6D3E4] focus:outline-none focus:ring-2 focus:ring-[#F6D3E4] placeholder-gray-400"
              placeholder="Enter your email"
            />
          </div>
          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full p-3 rounded-md bg-[#2D282A] text-[#F6D3E4] focus:outline-none focus:ring-2 focus:ring-[#F6D3E4] placeholder-gray-400"
              placeholder="Enter your password"
            />
          </div>
          {/* Sign In Button */}
          <button
            type="submit"
            className="w-full py-3 bg-[#F6D3E4] text-[#191516] font-semibold rounded-md hover:bg-[#e9c0d4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F6D3E4]"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
