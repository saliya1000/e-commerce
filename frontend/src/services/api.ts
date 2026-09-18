import axios from 'axios';

// The base URL points to the backend API via the proxy or directly.
// We use localhost:3000 for local development (assuming the React app is served on 5173).
// In production, this might be a relative path if served from the same domain.
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Important for sending and receiving the HttpOnly refresh token cookie
});

// A variable to hold the access token in memory
let inMemoryToken: string | null = null;

// Function to set the token (called from AuthContext upon login/refresh)
export const setAccessToken = (token: string | null) => {
  inMemoryToken = token;
};

// Request Interceptor: Attach the access token if available
api.interceptors.request.use(
  (config) => {
    if (inMemoryToken) {
      config.headers['Authorization'] = `Bearer ${inMemoryToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s by attempting to refresh the token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't retried this request yet, and it's not the refresh endpoint itself
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh the token using the HttpOnly cookie
        const refreshResponse = await axios.post(
          '/api/auth/refresh',
          {},
          { withCredentials: true }
        );
        
        const { accessToken } = refreshResponse.data;
        setAccessToken(accessToken);
        
        // Update the failed request with the new token and retry
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('[API Interceptor] Refresh failed. Triggering auth:logout', refreshError);
        // If refresh fails (e.g., refresh token expired or invalid), clear the token
        setAccessToken(null);
        // We can also trigger a custom event here to force a logout in the React tree
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
