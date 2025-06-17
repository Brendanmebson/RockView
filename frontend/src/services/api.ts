// frontend/src/services/api.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with production-ready configuration
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout for Render cold starts
  withCredentials: true, // Include cookies for CORS
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Retry configuration for network issues
  validateStatus: (status) => {
    return status >= 200 && status < 300;
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request [${config.method?.toUpperCase()}]:`, config.url);
      if (config.data) {
        console.log('📤 Request Data:', config.data);
      }
    }

    // Ensure CORS headers are set
    if (config.headers) {
      config.headers['Access-Control-Allow-Credentials'] = 'true';
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response [${response.status}]:`, response.config.url);
      if (response.data) {
        console.log('📥 Response Data:', response.data);
      }
    }

    return response;
  },
  (error: AxiosError) => {
    // Enhanced error handling
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data
    });

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.warn('🔑 Authentication error - redirecting to login');
      localStorage.removeItem('token');
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Handle CORS errors
    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
      console.error('🌐 CORS/Network Error Details:', {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        }
      });
      
      // Add user-friendly error message
      const corsError = new Error('Network connection error. Please check your internet connection and try again.');
      corsError.name = 'NetworkError';
      return Promise.reject(corsError);
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout');
      const timeoutError = new Error('Request timed out. The server might be starting up, please try again in a moment.');
      timeoutError.name = 'TimeoutError';
      return Promise.reject(timeoutError);
    }

    // Handle server errors (5xx)
    if (error.response?.status && error.response.status >= 500) {
      console.error('🔥 Server Error:', error.response.status);
      const serverError = new Error('Server error. Please try again later.');
      serverError.name = 'ServerError';
      return Promise.reject(serverError);
    }

    // Handle client errors (4xx)
    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
      console.error('📝 Client Error:', error.response.status, error.response.data);
    }

    return Promise.reject(error);
  }
);

// Utility functions for common API operations
export const apiUtils = {
  // Check if API is reachable
  healthCheck: async (): Promise<boolean> => {
    try {
      await api.get('/health');
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },

  // Retry failed requests
  retryRequest: async (originalRequest: AxiosRequestConfig, maxRetries: number = 3): Promise<AxiosResponse> => {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        return await api(originalRequest);
      } catch (error) {
        retries++;
        if (retries === maxRetries) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Max retries exceeded');
  },

  // Upload file with progress
  uploadFile: async (
    endpoint: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<AxiosResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },

  // Download file
  downloadFile: async (endpoint: string, filename: string): Promise<void> => {
    try {
      const response = await api.get(endpoint, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  },
};

// Export default axios instance
export default api;

// Export types for TypeScript
export type { AxiosResponse, AxiosError, AxiosRequestConfig };

// Development helper - log API configuration
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration:', {
    baseURL: API_URL,
    timeout: api.defaults.timeout,
    withCredentials: api.defaults.withCredentials,
  });
}