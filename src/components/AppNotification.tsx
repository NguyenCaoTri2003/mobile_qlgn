import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Type = "success" | "error" | "warning" | "info";

interface Props {
  visible: boolean;
  type?: Type;
  message: string;
  duration?: number;
  onHide: () => void;
}

export default function AppNotification({
  visible,
  type = "success",
  message,
  duration = 1600,
  onHide,
}: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const config = {
    success: {
      icon: "checkmark-circle",
      color: "#22c55e",
    },
    error: {
      icon: "close-circle",
      color: "#ef4444",
    },
    warning: {
      icon: "alert-circle",
      color: "#f59e0b",
    },
    info: {
      icon: "information-circle",
      color: "#3b82f6",
    },
  }[type];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => hide(), duration);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  };

  return (
    <Modal transparent visible={visible}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.box,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <Ionicons name={config.icon as any} size={60} color={config.color} />

          <Text style={styles.text}>{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  box: {
    backgroundColor: "white",
    paddingVertical: 28,
    paddingHorizontal: 36,
    borderRadius: 18,
    alignItems: "center",
    elevation: 8,
    minWidth: 220,
  },

  text: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    color: "#111827",
  },
});