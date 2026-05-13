import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import axios from "axios";
import axiosClient from "../api/axiosClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Platform } from "react-native";

const LOCATION_TASK = "shipper-location-task";
let currentOrderId: number | null = null;
let appState = AppState.currentState;

async function sendLocation(location: any) {
  console.log("📡 Sending location for order:", currentOrderId);
  console.log("📍 Coordinates:", location.coords.latitude, location.coords.longitude);

  if (!currentOrderId) {
    console.log("⚠️ No order_id, skipping");
    return;
  }

  try {
    const response = await axiosClient.post("/tracking/location", {
      order_id: currentOrderId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      // speed: location.coords.speed || 0, // THÊM: Gửi tốc độ
      // accuracy: location.coords.accuracy || 0, // THÊM: Gửi độ chính xác
      speed: 15, // THÊM: Gửi tốc độ
      accuracy: 0, // THÊM: Gửi độ chính xác
    });
    console.log("✅ Location sent successfully:", response);
    console.log("✅ Location sent:", response.data);
  } catch (err: any) {
    console.log("❌ Send location error:", err.message);
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

  // Lấy vị trí hiện tại
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });

    console.log("📍 Current location:", location.coords);

    // Gửi vị trí đầu tiên
    const response = await axiosClient.post("/tracking/location", {
      order_id: orderId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      speed: location.coords.speed || 0,
      accuracy: location.coords.accuracy || 0,
    });

    console.log("✅ First location sent:", response.data);

    try {
      const distanceResponse = await axiosClient.post("/tracking/calculate-initial-distance", {
        order_id: orderId,
      });
      
      console.log("📏 Initial distance:", distanceResponse.data);
      
      if (distanceResponse.data.success) {
        console.log(`✅ Khoảng cách ban đầu: ${distanceResponse.data.distance_km} km`);
        console.log(`📝 Phương pháp: ${distanceResponse.data.method}`);
      }
    } catch (distanceErr: any) {
      console.log("⚠️ Lỗi tính initial distance:", distanceErr.message);
    }

  } catch (err: any) {
    console.log("❌ Error sending first location:", err.message);
  }

  const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  console.log("Location tracking is running:", isRunning);
  
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    console.log("Stopped existing tracking");
  }

  // Cấu hình tracking với các tham số tối ưu
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 5000, // Gửi mỗi 5 giây
    distanceInterval: 20, // Hoặc khi di chuyển 20m
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Đang cập nhật hành trình",
      notificationBody: "Vị trí của bạn đang được cập nhật để khách hàng theo dõi tiến độ giao nhận",
      notificationColor: "#06b6d4",
    },
    pausesUpdatesAutomatically: false,
    activityType: Location.ActivityType.AutomotiveNavigation,
  });

  console.log("✅ Started location tracking with 5s interval");
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
