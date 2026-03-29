const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

export const api = {
  getToken: () => localStorage.getItem('nexus_token'),
  setToken: (token) => localStorage.setItem('nexus_token', token),
  clearToken: () => localStorage.removeItem('nexus_token'),

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  },

  // Example
  getProducts: () => api.request('/products'),
};