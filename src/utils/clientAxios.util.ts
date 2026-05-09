import axios from "axios";

const clientAxios = axios.create({
  baseURL: typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_API_URL || ""),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

clientAxios.interceptors.request.use(
  (config) => {
    // Asegurar que use el origin actual del navegador
    if (typeof window !== 'undefined' && !config.baseURL) {
      config.baseURL = window.location.origin;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

clientAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default clientAxios;
