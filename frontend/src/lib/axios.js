import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: 'http://localhost:8090/api',
  withCredentials: true,
});