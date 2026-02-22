import axios from 'axios';

const rawBase = import.meta.env.VITE_API_BASE_URL || '/api';
const API_BASE_URL = rawBase.replace(/\/+$/, '');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default apiClient;
