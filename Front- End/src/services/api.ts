import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add language header
api.interceptors.request.use((config) => {
  const lang = localStorage.getItem('i18nextLng') || 'en';
  config.headers['Accept-Language'] = lang;
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    throw error;
  }
);

// API endpoints
export const missionsAPI = {
  getMissions: async () => {
    const response = await api.get('/missions');
    return response.data.missions;
  },
  
  generateMissions: async (params: {
    n?: number;
    categories?: string[];
    difficulty?: string;
    lang?: string;
  }) => {
    const response = await api.post('/missions/generate', params);
    return response.data;
  },
  
  calculatePoints: async (completedMissions: string[]) => {
    const response = await api.post('/points/calc', { completed_missions: completedMissions });
    return response.data;
  },
};

export const carbonAPI = {
  analyze: async (data: {
    mode?: string;
    distance_km?: number;
    meat_meals?: number;
    veg_meals?: number;
    electricity_kwh?: number;
    lpg_kg?: number;
    waste_kg?: number;
    period?: string;
    lang?: string;
  }) => {
    const response = await api.post('/analyze', data);
    return response.data;
  },
  
  analyzeLog: async (data: { text: string; lang?: string }) => {
    const response = await api.post('/logs/analyze', data);
    return response.data;
  },

  explain: async (question: string, lang?: string) => {
    const response = await api.post('/explain', { question, lang });
    return response.data;
  },
};

export const dataAPI = {
  getTemperatureData: async (params?: {
    variable?: string;
    scenario?: string;
    model_hint?: string;
  }) => {
    const response = await api.get('/data/india/temp', { params });
    return response.data.series;
  },
};

export const agentAPI = {
  sendTask: async (task: string, options?: {
    lang?: string;
    emissions?: any;
    completed_missions?: string[];
  }) => {
    const response = await api.post('/agent', {
      task,
      ...options
    });
    return response.data;
  },
};

export default api;