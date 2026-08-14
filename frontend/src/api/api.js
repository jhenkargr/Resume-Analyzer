const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export function getAuthToken() {
  return localStorage.getItem('ra_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('ra_token', token);
  } else {
    localStorage.removeItem('ra_token');
  }
}

export async function request(endpoint, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is not FormData and not explicitly set, set Content-Type to JSON
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMsg = data.message || data.error || `Request failed with status ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } catch (err) {
    throw err;
  }
}

export const api = {
  auth: {
    login: (email, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (fullName, email, password) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password }),
      }),
  },
  users: {
    me: () => request('/users/me'),
  },
  resumes: {
    upload: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return request('/resumes/upload', {
        method: 'POST',
        body: formData,
      });
    },
    list: () => request('/resumes'),
    get: (id) => request(`/resumes/${id}`),
    delete: (id) => request(`/resumes/${id}`, { method: 'DELETE' }),
  },
  analysis: {
    run: (resumeId) =>
      request(`/analysis/${resumeId}`, {
        method: 'POST',
      }),
    getHistory: (resumeId) => request(`/analysis/${resumeId}/history`),
  },
  jobMatch: {
    run: (resumeId, jobDescription) =>
      request(`/job-match/${resumeId}`, {
        method: 'POST',
        body: JSON.stringify({ jobDescription }),
      }),
    getList: (resumeId) => request(`/job-match/${resumeId}`),
  },
  improvements: {
    run: (resumeId) =>
      request(`/improvements/${resumeId}`, {
        method: 'POST',
      }),
    getList: (resumeId) => request(`/improvements/${resumeId}`),
  },
  dashboard: {
    getSummary: () => request('/dashboard/summary'),
    getHistory: (resumeId) =>
      request(`/dashboard/history${resumeId ? `?resumeId=${resumeId}` : ''}`),
  },
};
