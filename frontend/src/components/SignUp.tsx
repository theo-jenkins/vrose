import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchCsrfToken, handleSignUp } from '../utils/auth';
import { useDispatch } from 'react-redux';

const SignUp: React.FC = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        keyWord: '',
        password: '',
        confirm_password: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({
        email: '',
        keyWord: '',
        password: '',
        confirm_password: '',
    });

    // Fetch CSRF token on page load
    useEffect(() => {
        fetchCsrfToken();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' })); // Clear only the current field's error
    };

    const validateForm = (): boolean => {
        // Explicitly define the type for `newErrors`
        const newErrors: Record<keyof typeof formData, string> = {
            email: '',
            keyWord: '',
            password: '',
            confirm_password: '',
        };

        if (!formData.email.includes('@')) newErrors.email = 'Please enter a valid email address';
        if (formData.keyWord.includes(' ')) newErrors.keyWord = 'Key word cannot contain spaces';
        if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters long';
        if (formData.password !== formData.confirm_password)
            newErrors.confirm_password = 'Passwords do not match';

        setErrors(newErrors);
        return !Object.values(newErrors).some((error) => error !== '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        handleSignUp(formData, setErrors, router, setIsSubmitting, dispatch);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#191516]">
            <div className="w-full max-w-md bg-[#191516] text-[#F6D3E4] rounded-lg p-8 hover:shadow-[0_0_10px_#F6D3E4] transition-shadow duration-300">
                <h2 className="text-3xl font-semibold text-center mb-2">Sign Up</h2>
                <hr className="my-6 h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-[#F6D3E4] to-transparent opacity-100" />

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Field */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            className="w-full p-3 rounded-md bg-[#2D282A] text-[#F6D3E4] focus:outline-none focus:ring-2 focus:ring-[#F6D3E4] placeholder-gray-400"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                    </div>

                    {/* Key Word Field */}
                    <div>
                        <label htmlFor="key-word" className="block text-sm font-medium mb-2">
                            Key Word (Optional)
                        </label>
                        <input
                            type="text"
                            id="key-word"
                            name="keyWord"
                            className="w-full p-3 rounded-md bg-[#2D282A] text-[#F6D3E4] focus:outline-none focus:ring-2 focus:ring-[#F6D3E4] placeholder-gray-400 italic"
                            placeholder="Enter your key word"
                            value={formData.keyWord}
                            onChange={handleChange}
                        />
                        {errors.keyWord && <p className="text-red-500 text-sm">{errors.keyWord}</p>}
                    </div>

                    {/* Divider */}
                    <hr className="my-6 h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-[#F6D3E4] to-transparent opacity-100" />

                    {/* Password Field */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="w-full p-3 rounded-md bg-[#2D282A] text-[#F6D3E4] focus:outline-none focus:ring-2 focus:ring-[#F6D3E4] placeholder-gray-400"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium mb-2">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirm-password"
                            name="confirm_password"
                            className="w-full p-3 rounded-md bg-[#2D282A] text-[#F6D3E4] focus:outline-none focus:ring-2 focus:ring-[#F6D3E4] placeholder-gray-400"
                            placeholder="Confirm your password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                        />
                        {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
                    </div>

                    {/* Sign Up Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-3 ${
                            isSubmitting ? 'bg-gray-400' : 'bg-[#F6D3E4]'
                        } text-[#191516] font-semibold rounded-md hover:bg-[#e9c0d4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F6D3E4]`}
                    >
                        {isSubmitting ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SignUp;
