import axios from 'axios';

// Backend API base URL
// In Vite, use import.meta.env instead of process.env
// For custom env vars, prefix with VITE_ (e.g., VITE_API_URL)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - automatically add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export default API instance
export default api;

// ============================================
// Authentication APIs
// ============================================
export const authAPI = {
  changePassword: (data) => api.post('/auth/change-password', data),
  getProfile: () => api.get('/auth/profile'),
  // Basic auth
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  // Password reset functions
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyResetToken: (token) => api.get(`/auth/verify-reset-token/${token}`),
  
  // Email verification functions
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  
  // 2FA functions
  setup2FA: (method) => api.post('/auth/2fa/setup', { method }), // method: 'app' or 'email'
  verify2FA: (token, method) => api.post('/auth/2fa/verify', { token, method }), // method: 'app' or 'email'
  validate2FA: (tempToken, token) => api.post('/auth/2fa/validate', { tempToken, token }),
  resend2FACode: (tempToken) => api.post('/auth/2fa/resend-code', { tempToken }),
  disable2FA: (password) => api.post('/auth/2fa/disable', { password })
};

// ============================================
// Donor APIs
// ============================================
export const donorAPI = {
  getAll: (filters = {}) => api.get('/donors', { params: filters }),
  getById: (id) => api.get(`/donors/${id}`),
  create: (donorData) => api.post('/donors', donorData),
  update: (id, donorData) => api.put(`/donors/${id}`, donorData),
  delete: (id) => api.delete(`/donors/${id}`)
};

// ============================================
// Donation APIs
// ============================================
export const donationAPI = {
  getAll: (filters = {}) => api.get('/donations', { params: filters }),
  create: (donationData) => api.post('/donations', donationData)
};

// ============================================
// Inventory APIs
// ============================================
export const inventoryAPI = {
  getAll: (filters = {}) => api.get('/inventory', { params: filters }),
  create: (inventoryData) => api.post('/inventory', inventoryData),
  update: (id, inventoryData) => api.put(`/inventory/${id}`, inventoryData),
  delete: (id) => api.delete(`/inventory/${id}`),
  withdraw: (withdrawalData) => api.post('/inventory/withdraw', withdrawalData)
};

// ============================================
// Prediction APIs
// ============================================
export const predictionAPI = {
  runPrediction: () => api.post('/predict-shortage'),
  getHistory: (filters = {}) => api.get('/predictions', { params: filters }),
  predictDonorAvailability: (donorId) => api.get(`/predictions/predict-donor/${donorId}`)
};

// ============================================
// Alert APIs
// ============================================
export const alertAPI = {
  getAll: (filters = {}) => api.get('/alerts', { params: filters }),
  create: (alertData) => api.post('/alerts', alertData),
  markAsNotified: (id) => api.put(`/alerts/${id}`, { notified: true }),
  delete: (id) => api.delete(`/alerts/${id}`)
};

// ============================================
// Email APIs
// ============================================
export const emailAPI = {
  send: (emailData) => api.post('/emails/send', emailData),
  getHistory: (filters = {}) => api.get('/emails/history', { params: filters }),
  getHistoryById: (id) => api.get(`/emails/history/${id}`)
};

// ============================================
// Schedule APIs
// ============================================
export const scheduleAPI = {
  getAll: (filters = {}) => api.get('/schedules', { params: filters }),
  create: (scheduleData) => api.post('/schedules', scheduleData),
  update: (id, scheduleData) => api.put(`/schedules/${id}`, scheduleData),
  delete: (id) => api.delete(`/schedules/${id}`)
};

// ============================================
// Dashboard APIs
// ============================================
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats')
};

// ============================================
// Reports APIs
// ============================================
export const reportsAPI = {
  getAnalytics: (timeRange = '6months') => api.get('/reports/analytics', { params: { timeRange } })
};

// ============================================
// Admin APIs
// ============================================
export const adminAPI = {
  getStock: () => api.get('/admin/stock'),
  getForecast: () => api.get('/admin/forecast'),
  getAvailableDonors: (limit = 20) => api.get('/admin/donors/available', { params: { limit } }),
  getShortageRisk: () => api.get('/admin/shortage-risk'),
  sendCampaign: (data) => api.post('/admin/campaign', data),
  getKPIs: () => api.get('/admin/kpis'),
  getActivity: (limit = 10) => api.get('/admin/activity', { params: { limit } }),
  getAllDonors: (filters = {}) => api.get('/admin/donors', { params: filters }),
  getStaff: () => api.get('/admin/staff'),
  createStaff: (data) => api.post('/admin/staff', data),
  deleteStaff: (id) => api.delete(`/admin/staff/${id}`),
  downloadReport: async (period = 'weekly') => {
    const response = await api.get('/admin/report', { 
      params: { period }, 
      responseType: 'blob' 
    });
    return response;
  }
};