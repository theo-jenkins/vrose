// api.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
// Import your Redux store and logout action
import store from '../../redux/store';
import { logoutSuccess, fetchUserDetails } from '../../redux/slices/authSlice';

// Extend AxiosRequestConfig to include our custom _retry flag.
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  withCredentials: true, // Important for sending/receiving cookies
  xsrfCookieName: 'csrftoken', // Django’s CSRF cookie name
  xsrfHeaderName: 'X-CSRFToken', // Django expects this header
});

// Request interceptor: Attach CSRF token from cookies.
api.interceptors.request.use((config: CustomAxiosRequestConfig) => {
  const csrfToken = Cookies.get('csrftoken');
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});

// Response interceptor: Handle 401 errors by attempting a token refresh.
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest: CustomAxiosRequestConfig = error.config;

    // Check if error is 401, hasn't been retried, and is not a refresh request itself.
    if (
      error?.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/token/refresh/'
    ) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh the token
        await api.post('/token/refresh/', {}, { withCredentials: true });
        console.log('Token refreshed successfully.');

        // Sets redux auth state
        store.dispatch(fetchUserDetails());

        // Retry the original request after a successful refresh
        return api(originalRequest);

      } catch (refreshError) {
        console.log('Refresh token failed:', refreshError);

        // Clear the cookies
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');

        // Dispatch logout action to clear Redux auth state.
        store.dispatch(logoutSuccess());
        
        // Redirect the user to the login page.
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
