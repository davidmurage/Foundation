import axios from "axios";
import { API_URL } from "./config";

export const http = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
