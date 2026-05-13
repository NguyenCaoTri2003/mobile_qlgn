import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface NoInternetScreenProps {
  visible: boolean;
  onRetry: () => void;
  isChecking?: boolean;
}

export default function NoInternetScreen({
  visible,
  onRetry,
  isChecking = false,
}: NoInternetScreenProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={["#FEE2E2", "#FECACA"]}
              style={styles.iconGradient}
            >
              <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>Mất kết nối mạng</Text>

          {/* Description */}
          <Text style={styles.desc}>
            Vui lòng kiểm tra WiFi hoặc dữ liệu di động{"\n"}và thử lại
          </Text>

          {/* Steps */}
          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <Ionicons name="wifi-outline" size={18} color="#64748B" />
              <Text style={styles.stepText}>Bật WiFi và kết nối</Text>
            </View>
            <View style={styles.step}>
              <Ionicons name="cellular-outline" size={18} color="#64748B" />
              <Text style={styles.stepText}>Bật dữ liệu di động</Text>
            </View>
            <View style={styles.step}>
              <Ionicons name="airplane-outline" size={18} color="#64748B" />
              <Text style={styles.stepText}>Tắt chế độ máy bay</Text>
            </View>
          </View>

          {/* Retry Button */}
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
            disabled={isChecking}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#3B82F6", "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.retryGradient}
            >
              {isChecking ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.retryText}>Thử lại</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    width: "100%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  desc: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  stepsContainer: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },
  retryButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});