import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants/api";
import { logoutStorage } from "../store/auth.store";

const axiosClient = axios.create({
  baseURL: API_URL,
});

axiosClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await logoutStorage();
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
