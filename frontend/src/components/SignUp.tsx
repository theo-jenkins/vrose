import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchCsrfToken, handleSignUp } from '../utils/auth';
import { useDispatch } from 'react-redux';

interface SignUpFormData {
  first_name: string;
  last_name: string;
  email: string;
  confirm_email: string;
  password: string;
  confirm_password: string;
}

export interface SignUpErrors {
  first_name: string;
  last_name: string;
  email: string;
  confirm_email: string;
  password: string;
  confirm_password: string;
}

const SignUp: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  
  // Form step: 1 = email only; 2 = additional fields
  const [formStep, setFormStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<SignUpFormData>({
    first_name: '',
    last_name: '',
    email: '',
    confirm_email: '',
    password: '',
    confirm_password: '',
  });
  
  const [errors, setErrors] = useState<SignUpErrors>({
    first_name: '',
    last_name: '',
    email: '',
    confirm_email: '',
    password: '',
    confirm_password: '',
  });
  
  useEffect(() => {
    fetchCsrfToken();
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };
  
  // Validate for step 1 (only email)
  const validateStepOne = (): boolean => {
    let valid = true;
    const newErrors: Partial<SignUpErrors> = {};
    
    if (!formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email address';
      valid = false;
    }
    
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return valid;
  };
  
  // Validate full form on step 2
  const validateForm = (): boolean => {
    let valid = true;
    const newErrors: Partial<SignUpErrors> = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
      valid = false;
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
      valid = false;
    }
    
    if (formData.email !== formData.confirm_email) {
      newErrors.confirm_email = 'Emails do not match';
      valid = false;
    }
    
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
      valid = false;
    }
    
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
      valid = false;
    }
    
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return valid;
  };
  
  // Handler for "Continue" in step 1
  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStepOne()) {
      setFormStep(2);
    }
  };
  
  // Final submission handler for step 2
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    handleSignUp(formData, setErrors, router, setIsSubmitting, dispatch);
  };
  
  return (
    <form className="space-y-3" onSubmit={formStep === 1 ? handleContinue : handleSubmit}>
          {/* Always render the email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              className="w-full p-3 mb-2 rounded-md bg-light-form-field dark:bg-dark-form-field placeholder-gray-400"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>
          
          {/* If still on step 1, show only the "Sign Up" button */}
          {formStep === 1 && (
            <button
              type="submit"
              className="w-full py-3 bg-light-primary-button dark:bg-dark-primary-button text-[#191516] font-semibold rounded-md hover:scale-105 transition-all duration:300 focus:outline-none"
            >
              Sign Up
            </button>
          )}
          
          {/* Animate the additional fields container */}
          <div
            className={`overflow-hidden py-2 px-2 transition-all duration-300 ${
              formStep === 2 ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {formStep === 2 && (
              <>
                {/* Confirm Email Field */}
                <div>
                  <label htmlFor="confirm_email" className="block text-sm font-medium mb-2">
                    Confirm Email
                  </label>
                  <input
                    type="email"
                    name="confirm_email"
                    id="confirm_email"
                    className="w-full p-3 mb-2 rounded-md bg-light-form-field dark:bg-dark-form-field placeholder-gray-400"
                    placeholder="Confirm your email"
                    value={formData.confirm_email}
                    onChange={handleChange}
                  />
                  {errors.confirm_email && <p className="text-red-500 text-sm">{errors.confirm_email}</p>}
                </div>

                {/* Divider */}
                <hr className="my-4 h-px border-0 bg-gradient-to-r from-transparent via-[#191516] dark:via-[#FCEEF5] to-transparent opacity-100" />

                {/* First Name Field */}
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    id="first_name"
                    className="w-full p-3 mb-2 rounded-md bg-light-form-field dark:bg-dark-form-field placeholder-gray-400"
                    placeholder="Enter your first name"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                  {errors.first_name && <p className="text-red-500 text-sm">{errors.first_name}</p>}
                </div>

                {/* Last Name Field */}
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    id="last_name"
                    className="w-full p-3 mb-2 rounded-md bg-light-form-field dark:bg-dark-form-field placeholder-gray-400"
                    placeholder="Enter your last name"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                  {errors.last_name && <p className="text-red-500 text-sm">{errors.last_name}</p>}
                </div>

                {/* Divider */}
                <hr className="my-4 h-px border-0 bg-gradient-to-r from-transparent via-[#191516] dark:via-[#FCEEF5] to-transparent opacity-100" />
                
                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="w-full p-3 mb-2 rounded-md bg-light-form-field dark:bg-dark-form-field placeholder-gray-400"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                </div>
                
                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirm_password"
                    name="confirm_password"
                    className="w-full p-3 mb-2 rounded-md bg-light-form-field dark:bg-dark-form-field placeholder-gray-400"
                    placeholder="Confirm your password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                  />
                  {errors.confirm_password && <p className="text-red-500 text-sm">{errors.confirm_password}</p>}
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 mt-3 ${
                    isSubmitting ? 'bg-gray-400' : 'bg-light-primary-button dark:bg-dark-primary-button'
                  } text-[#191516] font-semibold rounded-md hover:scale-105 transition-all duration:300 focus:outline-none`}
                >
                  {isSubmitting ? 'Signing Up...' : 'Sign Up'}
                </button>
              </>
            )}
          </div>
        </form>
  );
};

export default SignUp;
