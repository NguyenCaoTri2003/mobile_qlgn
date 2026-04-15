import axios from "axios";
import { API_URL } from "../constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const loginApi = (email: string, password: string) => {
  return axios.post(`${API_URL}/auth/login`, {
    email,
    password,
  });
};

export const removeDeviceToken = async (token: string) => {
  const accessToken = await AsyncStorage.getItem("access_token");

  return axios.post(
    `${API_URL}/device/remove-token`,
    { token },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
};