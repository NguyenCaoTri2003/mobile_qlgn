// src/contexts/LocationPermissionContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AppState } from "react-native";
import { checkLocationPermission, LocationPermissionStatus } from "../services/location-permission.service";

interface LocationPermissionContextType {
  permissionStatus: LocationPermissionStatus;
  checkPermission: () => Promise<void>;
  isModalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
}

const LocationPermissionContext = createContext<LocationPermissionContextType>({
  permissionStatus: "checking",
  checkPermission: async () => {},
  isModalVisible: false,
  setModalVisible: () => {},
});

export const useLocationPermission = () => useContext(LocationPermissionContext);

export const LocationPermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>("checking");
  const [isModalVisible, setModalVisible] = useState(false);

  const checkPermission = useCallback(async () => {
    const status = await checkLocationPermission();
    setPermissionStatus(status);
    
    // Hiển thị modal nếu không phải "granted_always"
    if (status !== "granted_always") {
      setModalVisible(true);
    } else {
      setModalVisible(false);
    }
  }, []);

  // Kiểm tra khi app khởi động
  useEffect(() => {
    checkPermission();
  }, []);

  // Kiểm tra lại khi app được focus (người dùng có thể đã thay đổi cài đặt)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkPermission();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkPermission]);

  return (
    <LocationPermissionContext.Provider
      value={{
        permissionStatus,
        checkPermission,
        isModalVisible,
        setModalVisible,
      }}
    >
      {children}
    </LocationPermissionContext.Provider>
  );
};