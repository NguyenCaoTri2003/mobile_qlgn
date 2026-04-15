import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function NotFoundView({
  title = "Không tìm thấy dữ liệu",
  subtitle,
  onBack,
}: {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -12,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.View
        style={[styles.iconWrapper, { transform: [{ translateY: floatAnim }] }]}
      >
        <View style={styles.glow} />

        <Ionicons
          name="document-text"
          size={82}
          color="#93c5fd"
          style={styles.iconBack}
        />

        <Ionicons name="document-text-outline" size={72} color="#2563eb" />
      </Animated.View>

      <Text style={styles.title}>{title}</Text>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      {onBack && (
        <TouchableOpacity style={styles.button} onPress={onBack}>
          <Ionicons name="arrow-back" size={16} color="white" />
          <Text style={styles.buttonText}>Quay về danh sách</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  glow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#dbeafe",
    opacity: 0.5,
  },

  iconBack: {
    position: "absolute",
    opacity: 0.7,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 14,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 6,
    textAlign: "center",
    lineHeight: 18,
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
    backgroundColor: "#2563eb",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },

  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});