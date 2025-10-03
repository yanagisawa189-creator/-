import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (email: string, password: string, userType: string) =>
    api.post('/auth/register', { email, password, userType }),
  
  verifyToken: () => api.get('/auth/verify'),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  
  createProfile: (data: any) => api.post('/users/profile', data),
  
  updateProfile: (data: any) => api.put('/users/profile', data),
};

export const matchingAPI = {
  searchDecisionMakers: (params: any) =>
    api.get('/matching/search/decision-makers', { params }),
  
  searchSalesCompanies: (params: any) =>
    api.get('/matching/search/sales-companies', { params }),
  
  sendMatchRequest: (data: any) => api.post('/matching/request', data),
  
  respondToMatchRequest: (requestId: string, status: string) =>
    api.put(`/matching/request/${requestId}/respond`, { status }),
  
  getMatchRequests: () => api.get('/matching/requests'),
};

export default api;