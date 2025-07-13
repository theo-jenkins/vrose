import api from "../services/api";
import Cookies from 'js-cookie';
import { AppDispatch } from "../../redux/store";
import { loginSuccess, logoutSuccess } from "../../redux/slices/authSlice";
import { SignUpErrors } from "../components/SignUp";

// Sign up function
export const handleSignUp = async (
  formData: { first_name: string; last_name: string; email: string; confirm_email: string; password: string; confirm_password: string },
  setErrors: React.Dispatch<React.SetStateAction<SignUpErrors>>,
  router: any,
  setIsSubmitting: (isSubmitting: boolean) => void,
  dispatch: AppDispatch // Redux dispatch
) => {
  setIsSubmitting(true);

  // Signup attempt
  try {
    const response = await api.post("/signup/", formData);
    if (response.status === 201) {
      console.log("Sign up successful:", response.data);
      dispatch(loginSuccess({
        user: response.data.user,
        accessToken: response.data.access,
        refreshToken: response.data.refresh,
        isGoogleAuth: false
      }));
      router.push("/"); // Redirect to home
    }
  } catch (error: any) {
    if (error.response?.data?.errors) {
      setErrors({
        first_name: error.response.data.errors?.first_name?.[0] || "",
        last_name: error.response.data.errors?.last_name?.[0] || "",
        email: error.response.data.errors?.email?.[0] || "",
        confirm_email: error.response.data.errors?.confirm_email?.[0] || "",
        password: error.response.data.errors?.password?.[0] || "",
        confirm_password: error.response.data.errors?.confirm_password?.[0] || "",
      });
    }
    console.error("Signup failed:", error.response?.data || error);
  } finally {
    setIsSubmitting(false);
  }
};

// Sign in function
export const handleSignIn = async (credentials: { email: string; password: string }, dispatch: AppDispatch) => {
  // Clears cookies to not interfere with new signin
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
  try {
    const response = await api.post("/signin/", credentials);
    if (response.status === 200) {
      dispatch(loginSuccess({
        user: response.data.user,
        accessToken: response.data.access,
        refreshToken: response.data.refresh,
        isGoogleAuth: false
      }));
    }
    return response;
  } catch (error) {
    console.error("Sign in failed:", error);
    throw error;
  }
};

// Logout function
export const logout = async (dispatch: AppDispatch) => {
  try {
    const response = await api.post("/logout/");
    if (response.status === 200) {
      console.log("Logout successful:", response.data);
      dispatch(logoutSuccess()); // Remove user from Redux
    }
    return response;
  } catch (error) {
    console.error("Logout failed:", error); // First error being thrown
  }
};

// Google authentication function
export const handleGoogleSuccess = async (
  credentialResponse: any,
  dispatch: AppDispatch,
  router: any,
  onSuccess?: () => void,
  onError?: (error: string) => void
) => {
  // Clears cookies to not interfere with new signin
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
  
  try {
    // Ensure CSRF token is available before making the request
    await fetchCsrfToken();
    
    console.log('Making Google auth request with credential:', credentialResponse.credential ? 'Present' : 'Missing');
    const response = await api.post("/google-auth/", { credential: credentialResponse.credential });
    
    if (response.status === 200 && response.data.success) {
      console.log("Google authentication successful:", response.data);
      dispatch(loginSuccess({
        user: response.data.user,
        accessToken: response.data.access,
        refreshToken: response.data.refresh,
        isGoogleAuth: true
      }));

      // Call success callback or redirect
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    } else {
      const errorMessage = response.data.error || 'Google authentication failed';
      if (onError) {
        onError(errorMessage);
      } else {
        console.error('Google Login failed:', errorMessage);
      }
    }
    return response;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || 'Network error during Google authentication';
    if (onError) {
      onError(errorMessage);
    } else {
      console.error('Google Login error:', error);
    }
    throw error;
  }
};

// Fetch Csrf token
export const fetchCsrfToken = async () => {
  // Check if the CSRF token already exists in the cookies
  const existingToken = Cookies.get('csrftoken');
  if (existingToken) {
    console.log('CSRF token already exists.');
    return Promise.resolve(existingToken);
  }
  try {
    const response = await api.get("/csrf-token/");
    const data = await response.data;
    console.log('CSRF token fetched:', data);
    return data;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
};

