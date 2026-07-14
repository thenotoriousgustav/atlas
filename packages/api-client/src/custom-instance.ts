import axios, { AxiosRequestConfig } from 'axios';

export const AXIOS_INSTANCE = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  withCredentials: true, // Crucial for HTTP-only cookies!
});

// Response interceptor to auto-refresh tokens on 401 Unauthorized
AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to rotate tokens via refresh endpoint
        await AXIOS_INSTANCE.post('/v1/auth/refresh');
        // Retry the original request
        return AXIOS_INSTANCE(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect client to login page if window exists
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  return AXIOS_INSTANCE({
    ...config,
    ...options,
  }).then((response) => response.data);
};

export default customInstance;
