import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { authService } from './auth.service';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../constants/api';
import axiosClient from '../api/axiosClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function registerForPushNotifications(userToken: string) {
  if (!Device.isDevice) return;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const token = await Notifications.getDevicePushTokenAsync();

  await AsyncStorage.setItem("fcm_token", token.data);

  console.log("fcm_token: ", token.data)

  await axiosClient.post("/device/save-token", {
    token: token.data,
  });

  return token.data;
}

