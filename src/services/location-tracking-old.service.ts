// import * as TaskManager from "expo-task-manager";
// import * as Location from "expo-location";
// import axios from "axios";
// import axiosClient from "../api/axiosClient";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// const LOCATION_TASK = "shipper-location-task";

// let currentOrderId: number | null = null;

// async function sendLocation(location: any) {
//   console.log("Sending location for order:", currentOrderId, location.coords);

//   if (!currentOrderId) return;

//   try {
//     await axiosClient.post("/tracking/location", {
//       order_id: currentOrderId,
//       latitude: location.coords.latitude,
//       longitude: location.coords.longitude,
//     });
//   } catch (err: any) {
//     console.log("Send location error:", err.message);
//   }
// }

// TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
//   if (error) {
//     console.log("Task error:", error);
//     return;
//   }

//   console.log("🔥 TASK RUNNING");

//   const { locations } = data as any;
//   const location = locations[0];

//   console.log("📍 Location:", location.coords);

//   await sendLocation(location);
// });

// export const sendCurrentLocationOnce = async (orderId: number) => {
//   try {
//     const { status } = await Location.requestForegroundPermissionsAsync();

//     if (status !== "granted") {
//       console.log("No location permission");
//       return;
//     }

//     const location = await Location.getCurrentPositionAsync({
//       accuracy: Location.Accuracy.High,
//     });

//     console.log("📍 Send FIRST location:", location.coords);

//     await axiosClient.post("/tracking/location", {
//       order_id: orderId,
//       latitude: location.coords.latitude,
//       longitude: location.coords.longitude,
//     });
//   } catch (err: any) {
//     console.log("Send first location error:", err.message);
//   }
// };

// export const startTracking = async (orderId: number) => {
//   currentOrderId = orderId;
//   await AsyncStorage.setItem("tracking_order_id", orderId.toString());

//   const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  
//   if (foregroundStatus !== "granted") {
//     console.log("Foreground location permission not granted");
//     return;
//   }

//   const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  
//   if (backgroundStatus !== "granted") {
//     console.log("Background location permission not granted");
//     return;
//   }

//   const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);

//   console.log("Location tracking is running:", isRunning);
  
//   if (!isRunning) {
//     await Location.startLocationUpdatesAsync(LOCATION_TASK, {
//       accuracy: Location.Accuracy.High,
//       timeInterval: 10 * 60 * 1000,
//       distanceInterval: 50,
//       showsBackgroundLocationIndicator: true,
//       foregroundService: {
//         notificationTitle: "Đang theo dõi vị trí",
//         notificationBody: "App đang chạy để cập nhật vị trí giao hàng",
//         notificationColor: "#06b6d4",
//       },
//       pausesUpdatesAutomatically: false,
//       activityType: Location.ActivityType.AutomotiveNavigation,
//     });

//     console.log("Started location tracking for order:", orderId);
//   }
// };

// // Stop tracking
// export const stopTracking = async () => {
//   currentOrderId = null;

//   await AsyncStorage.removeItem("tracking_order_id");

//   const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);

//   if (isRunning) {
//     await Location.stopLocationUpdatesAsync(LOCATION_TASK);
//   }
// };

import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import axios from "axios";
import axiosClient from "../api/axiosClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Platform } from "react-native";

const LOCATION_TASK = "shipper-location-task";
let currentOrderId: number | null = null;
let appState = AppState.currentState;

// Bỏ qua kiểm tra thời gian trên server (tạm thời comment để test)
// Trên server đã comment phần kiểm tra 10 phút

async function sendLocation(location: any) {
  console.log("📡 Sending location for order:", currentOrderId);
  console.log("📍 Coordinates:", location.coords.latitude, location.coords.longitude);
  console.log("⏱️ Timestamp:", new Date().toISOString());

  if (!currentOrderId) {
    console.log("⚠️ No order_id, skipping");
    return;
  }

  try {
    const response = await axiosClient.post("/tracking/location", {
      order_id: currentOrderId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    console.log("✅ Location sent successfully:", response.data);
  } catch (err: any) {
    console.log("❌ Send location error:", err.message);
    if (err.response) {
      console.log("Response data:", err.response.data);
    }
  }
}

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.log("❌ Task error:", error);
    return;
  }

  const { locations } = data as any;
  
  if (!locations || locations.length === 0) {
    console.log("⚠️ No locations received");
    return;
  }

  console.log(`🔥 TASK RUNNING - Received ${locations.length} locations`);
  
  // Gửi từng location một
  for (const location of locations) {
    await sendLocation(location);
  }
});

export const sendCurrentLocationOnce = async (orderId: number) => {
  try {
    console.log("📍 Sending first location for order:", orderId);
    
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("❌ No location permission");
      return;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    console.log("📍 Current location:", location.coords);

    await axiosClient.post("/tracking/location", {
      order_id: orderId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    
    console.log("✅ First location sent successfully");
  } catch (err: any) {
    console.log("❌ Send first location error:", err.message);
  }
};

export const startTracking = async (orderId: number) => {
  console.log("🚀 START TRACKING for order:", orderId);
  
  currentOrderId = orderId;
  await AsyncStorage.setItem("tracking_order_id", orderId.toString());

  // Request permissions
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  console.log("Foreground permission:", foregroundStatus);
  
  if (foregroundStatus !== "granted") {
    console.log("❌ Foreground location permission not granted");
    return;
  }

  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  console.log("Background permission:", backgroundStatus);
  
  if (backgroundStatus !== "granted") {
    console.log("❌ Background location permission not granted");
    return;
  }

  // Stop existing tracking if any
  const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  console.log("Location tracking is running:", isRunning);
  
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    console.log("Stopped existing tracking");
  }

  // Start new tracking with aggressive settings for testing
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.BestForNavigation, // Highest accuracy for testing
    timeInterval: 5000, // 5 seconds for testing (để test nhanh)
    distanceInterval: 0, // Update regardless of distance
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Đang theo dõi vị trí",
      notificationBody: "App đang chạy để cập nhật vị trí giao hàng",
      notificationColor: "#06b6d4",
    },
    pausesUpdatesAutomatically: false,
    activityType: Location.ActivityType.AutomotiveNavigation,
    deferredUpdatesDistance: 0,
    deferredUpdatesInterval: 0,
    deferredUpdatesTimeout: 0,
  });

  console.log("✅ Started location tracking with 5s interval for testing");
  
  // Log current app state
  console.log("Current App State:", appState);
  
  // Test immediate location after 2 seconds
  setTimeout(async () => {
    console.log("🔍 Testing location after 2 seconds...");
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    console.log("Test location:", location.coords);
  }, 2000);
};

export const stopTracking = async () => {
  console.log("🛑 STOP TRACKING");
  currentOrderId = null;
  await AsyncStorage.removeItem("tracking_order_id");

  const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    console.log("✅ Stopped location tracking");
  }
};