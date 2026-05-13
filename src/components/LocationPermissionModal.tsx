// src/components/LocationPermissionModal.tsx
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocationPermission } from "../contexts/LocationPermissionContext";
import { openAppSettings } from "../services/location-permission.service";

const LocationPermissionModal: React.FC = () => {
  const { permissionStatus, isModalVisible, checkPermission } = useLocationPermission();

  const handleOpenSettings = () => {
    openAppSettings();
  };

  const handleRetry = async () => {
    await checkPermission();
  };

  const getMessageByStatus = () => {
    switch (permissionStatus) {
      case "denied":
        return {
          title: "Cần Quyền Truy Cập Vị Trí",
          message:
            "Ứng dụng cần quyền truy cập vị trí 'Luôn luôn' để theo dõi đơn hàng và cập nhật vị trí của bạn. Vui lòng vào Cài đặt để cấp quyền.",
          icon: "location-offline" as const,
          primaryButton: "Mở Cài Đặt",
          primaryAction: handleOpenSettings,
        };
      case "granted_foreground":
        return {
          title: "Cần Quyền Vị Trí Luôn Luôn",
          message:
            "Ứng dụng cần quyền truy cập vị trí 'Luôn luôn' để hoạt động trong nền. Vui lòng cập nhật quyền trong Cài đặt > Quyền riêng tư > Dịch vụ Vị trí.",
          icon: "compass" as const,
          primaryButton: "Mở Cài Đặt",
          primaryAction: handleOpenSettings,
        };
      default:
        return {
          title: "Xác Nhận Quyền Vị Trí",
          message:
            "Ứng dụng cần quyền truy cập vị trí 'Luôn luôn' để hoạt động. Vui lòng cấp quyền để tiếp tục.",
          icon: "navigate" as const,
          primaryButton: "Cấp Quyền",
          primaryAction: handleRetry,
        };
    }
  };

  const { title, message, icon, primaryButton, primaryAction } = getMessageByStatus();

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => {}} // Không cho phép đóng modal
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name={"location-outline"} size={48} color="#EF4444" />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={primaryAction}
            activeOpacity={0.8}
          >
            <Ionicons
              name={permissionStatus === "denied" || permissionStatus === "granted_foreground" ? "settings-outline" : "locate-outline"}
              size={20}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.primaryButtonText}>{primaryButton}</Text>
          </TouchableOpacity>

          {permissionStatus === "denied" && (
            <Text style={styles.hintText}>
              {Platform.OS === "ios"
                ? "Cài đặt > Quyền riêng tư > Dịch vụ Vị trí > [Tên App] > Luôn luôn"
                : "Cài đặt > Ứng dụng > [Tên App] > Quyền > Vị trí > Cho phép luôn luôn"}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  hintText: {
    marginTop: 16,
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
  },
});

export default LocationPermissionModal;