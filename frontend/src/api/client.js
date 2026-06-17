import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach access token
client.interceptors.request.use(
  (config) => {
    const tokens = JSON.parse(localStorage.getItem('tokens'));
    if (tokens?.access) {
      config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh on 401
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const tokens = JSON.parse(localStorage.getItem('tokens'));
        if (tokens?.refresh) {
          const res = await axios.post('http://localhost:8000/api/auth/token/refresh/', {
            refresh: tokens.refresh,
          });
          const newAccess = res.data.access;
          
          localStorage.setItem(
            'tokens',
            JSON.stringify({ ...tokens, access: newAccess })
          );
          
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return client(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token expired or invalid; logout user
        localStorage.removeItem('tokens');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
