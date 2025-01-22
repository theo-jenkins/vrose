import React, { useState } from 'react';
import { useRouter } from 'next/router'; // For redirection

const SignUp = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        keyWord: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({
        email: '',
        keyWord: '',
        password: '',
        confirmPassword: '',
    });
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: '' });
    };

    const validateForm = () => {
        const newErrors = { email: '', keyWord: '', password: '', confirmPassword: '' };
        let isValid = true;

        if (!formData.email.includes('@')) {
            newErrors.email = 'Please enter a valid email address';
            isValid = false;
        }

        if (formData.keyWord.includes(' ')) {
            newErrors.keyWord = 'Key word cannot contain spaces';
            isValid = false;
        }

        if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters long';
            isValid = false;
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("http://localhost:8000/api/signup/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    key_word: formData.keyWord, // Match backend field names
                    password: formData.password,
                    confirm_password: formData.confirmPassword, // Match backend field names
                }),
            });

            const responseBody = await response.json();

            if (!response.ok) {
                if (responseBody.errors) {
                    // Map backend errors to form field errors
                    setErrors((prevErrors) => ({
                        ...prevErrors,
                        email: responseBody.errors.email?.[0] || '',
                        keyWord: responseBody.errors.key_word?.[0] || '',
                        password: responseBody.errors.password?.[0] || '',
                        confirmPassword: responseBody.errors.confirm_password?.[0] || '',
                    }));
                }
                console.error(`Signup failed with status: ${response.status}`, responseBody);
                return; // Prevent throwing an error and exiting
            }
            
            // Redirect on success
            console.log("Sign up successful:", responseBody);
            router.push("/home/");

        } catch (error) {
            console.error("Error signing up:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#191516]">
            <div className="w-full max-w-md bg-[#191516] text-[#F6D3E4] rounded-lg p-8 hover:shadow-[0_0_10px_#F6D3E4] transition-shadow duration-300">
                <h2 className="text-3xl font-semibold text-center mb-2">Sign Up</h2>

                {/* Divider */}
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
                            className={`w-full p-3 rounded-md bg-[#2D282A] text-[#F6D3E4] focus:outline-none focus:ring-2 focus:ring-[#F6D3E4] placeholder-gray-400 ${
                                errors.email ? "border-red-500" : ""
                            }`}
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                    </div>
                    {/* Key Word Field */}
                    <div>
                        <label htmlFor="key-word" className="block text-sm font-medium mb-2">
                            Key Word
                        </label>
                        <input
                            type="text"
                            id="key-word"
                            name="keyWord"
                            className={`w-full p-3 rounded-md bg-[#2D282A] text-[#F6D3E4] focus:outline-none focus:ring-2 focus:ring-[#F6D3E4] placeholder-gray-400 ${
                                errors.keyWord ? "border-red-500" : ""
                            }`}
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
                            className={`w-full p-3 rounded-md bg-[#2D282A] text-[#F6D3E4] focus:outline-none focus:ring-2 focus:ring-[#F6D3E4] placeholder-gray-400 ${
                                errors.password ? "border-red-500" : ""
                            }`}
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
                            name="confirmPassword"
                            className={`w-full p-3 rounded-md bg-[#2D282A] text-[#F6D3E4] focus:outline-none focus:ring-2 focus:ring-[#F6D3E4] placeholder-gray-400 ${
                                errors.confirmPassword ? "border-red-500" : ""
                            }`}
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                        {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
                    </div>

                    {/* Sign Up Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-3 ${
                            isSubmitting ? "bg-gray-400" : "bg-[#F6D3E4]"
                        } text-[#191516] font-semibold rounded-md hover:bg-[#e9c0d4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F6D3E4]`}
                    >
                        {isSubmitting ? "Signing Up..." : "Sign Up"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SignUp;
