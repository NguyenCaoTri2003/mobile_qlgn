import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosClient from "../api/axiosClient";
import { jwtDecode } from "jwt-decode";
import { removeDeviceToken } from "../api/auth.api";

export const saveUser = async (
  user: any,
  token: string,
  nhigiaExpired?: string
) => {
  await AsyncStorage.setItem("nhigia_user", JSON.stringify(user));
  await AsyncStorage.setItem("access_token", token);

  if (nhigiaExpired) {
    await AsyncStorage.setItem("nhigia_expired", nhigiaExpired);
  }

};

export const isNhigiaExpired = (expired: string) => {
  try {
    return new Date(expired).getTime() < Date.now();
  } catch {
    return true;
  }
};

export const logoutStorage = async () => {
  const token = await AsyncStorage.getItem("fcm_token");

  if (token) {
    await removeDeviceToken(token)
  }

  await AsyncStorage.removeItem("nhigia_user");
  await AsyncStorage.removeItem("access_token");
  await AsyncStorage.removeItem("nhigia_expired");
};

export const isTokenExpired = (token: string) => {
  try {
    const decoded: any = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};
