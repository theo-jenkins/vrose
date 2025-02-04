import api from "../services/api";
import { AppDispatch } from "../../redux/store";
import { loginSuccess, logoutSuccess } from "../../redux/slices/authSlice";

// Sign up function
export const handleSignUp = async (
  formData: { email: string; keyWord: string; password: string; confirm_password: string },
  setErrors: (errors: Record<string, string>) => void,
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
        id: response.data.user.id,
        email: response.data.user.email
      }));
      router.push("/home"); // Redirect to home
    }
  } catch (error: any) {
    if (error.response?.data?.errors) {
      setErrors({
        email: error.response.data.errors?.email?.[0] || "",
        keyWord: error.response.data.errors?.key_word?.[0] || "",
        password: error.response.data.errors?.password?.[0] || "",
        confirm_password: error.response.data.errors?.confirm_password?.[0] || "",
      });
    }
    console.error("Signup failed:", error.response?.data || error);
  } finally {
    setIsSubmitting(false);
  }
};

// Login function
export const login = async (credentials: { email: string; password: string }, dispatch: AppDispatch) => {
  try {
    const response = await api.post("/login/", credentials);
    if (response.status === 200) {
      console.log("Login successful:", response.data); // Returns access and refresh tokens
      dispatch(loginSuccess({
        id: response.data.user.id,
        email: response.data.user.email
      }));
    }
    return response;
  } catch (error) {
    console.error("Login failed:", error);
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
  } catch (error) {
    console.error("Logout failed:", error); // First error being thrown
  }
};

// Fetch Csrf token
export const fetchCsrfToken = async () => {
  try {
    const response = await api.get("/csrf-token/");
    console.log("CSRF token fetched successfully.");
    return response;
  } catch (err) {
    console.error("CSRF token not available, skipping fetch:", err);
    return null; // Avoid crashing if CSRF isn't available
  }
};