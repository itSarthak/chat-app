import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: 'https://www.chatbackend.space/api/api',
  withCredentials: true,
});