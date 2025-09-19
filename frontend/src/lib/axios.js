import axios from 'axios';

export const axiosInstance = axios.create({
  // baseURL: 'https://www.chatbackend.space/api/api',
  baseURL: import.meta.env.VITE_BASE_URL,
  withCredentials: true,
});