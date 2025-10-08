import axios, { AxiosRequestConfig } from 'axios';
import { getApiUrl } from './api';

const API_URL = getApiUrl();

export const createAuthenticatedRequest = (config: AxiosRequestConfig = {}) => {
  const token = localStorage.getItem('token');
  
  return {
    ...config,
    headers: {
      ...config.headers,
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };
};

export const apiGet = (url: string, config?: AxiosRequestConfig) => {
  return axios.get(url, createAuthenticatedRequest(config));
};

export const apiPost = (url: string, data?: any, config?: AxiosRequestConfig) => {
  return axios.post(url, data, createAuthenticatedRequest(config));
};

export const apiPut = (url: string, data?: any, config?: AxiosRequestConfig) => {
  return axios.put(url, data, createAuthenticatedRequest(config));
};

export const apiDelete = (url: string, config?: AxiosRequestConfig) => {
  return axios.delete(url, createAuthenticatedRequest(config));
};

// Export the API URL for convenience
export { API_URL };