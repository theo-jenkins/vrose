import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

const api: AxiosInstance = axios.create({
    baseURL: 'http://localhost:8000/api',
    withCredentials: true, // Important for sending/receiving cookies
    xsrfCookieName: 'csrftoken',     // Cookie name Django sets
    xsrfHeaderName: 'X-CSRFToken',   // Header name Django expects
});

// Request interceptor
api.interceptors.request.use((config) => {
    // Retrieve the CSRF token from the `csrftoken` cookie
    const csrfToken = Cookies.get('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
  });

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh the token
        await api.post('/token/refresh/', {}, {
          withCredentials: true
        });
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;