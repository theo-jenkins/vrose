import api from '../services/api';

// Sends sign up request and redirects to users home page
export const handleSignUp = async (
    formData: {
      email: string;
      keyWord: string;
      password: string;
      confirmPassword: string;
    },
    setErrors: (errors: Record<string, string>) => void,
    router: any,
    setIsSubmitting: (isSubmitting: boolean) => void
  ) => {
    setIsSubmitting(true);
  
    try {
      const response = await api.post('/signup/', {
        email: formData.email,
        key_word: formData.keyWord,
        password: formData.password,
        confirm_password: formData.confirmPassword,
      });
  
      if (response.status === 200) {
        console.log('Sign up successful:', response.data);
        router.push('/home'); // Redirect to home page
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors({
          email: error.response.data.errors?.email?.[0] || '',
          keyWord: error.response.data.errors?.key_word?.[0] || '',
          password: error.response.data.errors?.password?.[0] || '',
          confirmPassword: error.response.data.errors?.confirm_password?.[0] || '',
        });
      }
      console.error('Signup failed:', error.response?.data || error);
    } finally {
      setIsSubmitting(false);
    }
  };

// Sends login request and redirects to users home page
interface Credentials {
    email: string;
    password: string;
}

export const login = async (credentials: Credentials) => {
    const response = await api.post('/login/', credentials);
    return response;
};

// Sends logout request and redirects to index page
export const logout = async () => {
    return api.post('/logout/', {});
};

// Sends a CSRF token request and returns the response
export const fetchCsrfToken = async () => {
    try {
      await api.get('/csrf-token/'); // Call your get_csrf_token endpoint
      console.log('CSRF token fetched and cookie set.');
    } catch (err) {
      console.error('Failed to fetch CSRF token:', err);
    }
  };