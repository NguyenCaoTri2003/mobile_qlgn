import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function EmptyState({
  icon = "notifications-off-outline",
  title = "Không có dữ liệu",
  description = "Hiện vẫn chưa có dữ liệu nào",
}: any) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale }], opacity },
      ]}
    >
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={60} color="#9ca3af" />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 100,
    paddingHorizontal: 30,
  },

  iconBox: {
    width: 110,
    height: 110,
    borderRadius: 60,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
  },

  desc: {
    marginTop: 6,
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },
});