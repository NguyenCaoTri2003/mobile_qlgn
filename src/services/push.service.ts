// import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device';
// import { authService } from './auth.service';
// import { useAuth } from '../contexts/AuthContext';
// import { API_URL } from '../constants/api';
// import axiosClient from '../api/axiosClient';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// export async function registerForPushNotifications(userToken: string) {
//   // if (!Device.isDevice) return;

//   const { status } = await Notifications.requestPermissionsAsync();
//   if (status !== 'granted') return;

//   const token = await Notifications.getDevicePushTokenAsync();

//   await AsyncStorage.setItem("fcm_token", token.data);

//   console.log("fcm_token: ", token.data)

//   await axiosClient.post("/device/save-token", {
//     token: token.data,
//     platform: 'mobile'
//   });

//   return token.data;
// }

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import messaging from "@react-native-firebase/messaging";
import axiosClient from "../api/axiosClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();

  // if (status !== 'granted') return;

  let token = "";

  if (Platform.OS === "android") {
    const res = await Notifications.getDevicePushTokenAsync();
    token = res.data;
  }

  // if (Platform.OS === 'ios') {
  //   await messaging().registerDeviceForRemoteMessages();

  //   token = await messaging().getToken();
  // }

  if (Platform.OS === "ios") {
    await messaging().registerDeviceForRemoteMessages();

    const authStatus = await messaging().requestPermission();

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      return;
    }

    const apnsToken = await messaging().getAPNSToken();
    console.log("APNS TOKEN:", apnsToken);

    token = await messaging().getToken();
  }

  await AsyncStorage.setItem("fcm_token", token);

  await axiosClient.post("/device/save-token", {
    token,
    platform: "mobile",
  });

  return token;
}
