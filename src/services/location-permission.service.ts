import * as Location from "expo-location";
import { Platform, Alert, Linking } from "react-native";

export type LocationPermissionStatus = 
  | "granted_always" 
  | "granted_foreground" 
  | "denied" 
  | "checking";

export const checkLocationPermission = async (): Promise<LocationPermissionStatus> => {
  try {
    const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
    
    if (!foregroundStatus || foregroundStatus !== "granted") {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return "denied";
      }
    }

    // Kiểm tra quyền background (Always)
    if (Platform.OS === "ios") {
      const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
      
      if (backgroundStatus === "granted") {
        return "granted_always";
      }
      
      // Yêu cầu quyền background
      const { status: newBackgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (newBackgroundStatus === "granted") {
        return "granted_always";
      }
      
      return "granted_foreground";
    } else {
      // Android
      const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
      
      if (backgroundStatus === "granted") {
        return "granted_always";
      }
      
      // Android: Yêu cầu quyền background
      const { status: newBackgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (newBackgroundStatus === "granted") {
        return "granted_always";
      }
      
      return "granted_foreground";
    }
  } catch (error) {
    console.error("Error checking location permission:", error);
    return "denied";
  }
};

export const openAppSettings = () => {
  if (Platform.OS === "ios") {
    Linking.openURL("app-settings:");
  } else {
    Linking.openSettings();
  }
};