import axios from 'axios';

// Create a centralized axios instance
const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  timeout: 30000, // 30s timeout (ML model can be slow)
});


// Add a request interceptor for potential future auth tokens
api.interceptors.request.use(
  (config) => {
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor for "safe" error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error format to avoid "Unexpected token <" HTML parsing issues
    const message = 
      error.response?.data?.error || 
      error.response?.data?.message || 
      error.message || 
      "An unexpected error occurred connection to the server.";
    
    // Create a normalized error object
    const normalizedError = new Error(message);
    (normalizedError as any).status = error.response?.status;
    (normalizedError as any).data = error.response?.data;
    
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, message);
    
    return Promise.reject(normalizedError);
  }
);

export default api;
