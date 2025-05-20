import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Function to get CSRF token
const getCSRFToken = async () => {
  try {
    const response = await axios.get(`${API_URL}/auth/`, {
      withCredentials: true
    });
    return response.data.csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return null;
  }
};

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Only add CSRF token for non-GET requests
    if (config.method !== 'get') {
      const token = await getCSRFToken();
      if (token) {
        config.headers['X-CSRFToken'] = token;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 403) {
      // Try to refresh CSRF token and retry the request once
      const originalRequest = error.config;
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        const token = await getCSRFToken();
        if (token) {
          originalRequest.headers['X-CSRFToken'] = token;
          return api(originalRequest);
        }
      }
    }
    return Promise.reject(error);
  }
);

export const login = async (username, password) => {
  const token = await getCSRFToken();
  return api.post('/auth/',
    { action: 'login', username, password },
    { headers: { 'X-CSRFToken': token } }
  );
};

export const register = async (username, email, password) => {
  const token = await getCSRFToken();
  return api.post('/auth/',
    { action: 'register', username, email, password },
    { headers: { 'X-CSRFToken': token } }
  );
};

export const logout = async () => {
  const token = await getCSRFToken();
  return api.post('/auth/',
    { action: 'logout' },
    { headers: { 'X-CSRFToken': token } }
  );
};



export const getForms = () =>
  api.get('/forms/');

export const createForm = (formData) =>
  api.post('/forms/', formData);

export const updateForm = (formId, formData) =>
  api.put(`/forms/${formId}/`, formData);

export const getForm = (formId) =>
  api.get(`/forms/${formId}/`);

export const getFormResponses = (formId) =>
  api.get(`/forms/${formId}/responses/`);

export const submitResponse = async (formId, responseData) => {
  try {
    const token = await getCSRFToken();
    const response = await api.post(
      `/forms/${formId}/responses/`,
      responseData,
      {
        headers: {
          'X-CSRFToken': token,
          'Content-Type': 'application/json',
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

export const exportResponses = (formId) =>
  api.get(`/forms/${formId}/export_csv/`, { responseType: 'blob' });

export default api;