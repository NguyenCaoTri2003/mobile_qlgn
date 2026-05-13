import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View, Animated, Easing } from "react-native";
import { useEffect, useRef } from "react";

export const EmptyState = ({ type = "default", onAction }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const isSearch = type === "search";
  const isToday = type === "today";

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Glow effect behind the icon */}
      <Animated.View
        style={[
          styles.glowEffect,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      
      <Animated.View
        style={[
          styles.iconBox,
          {
            transform: [{ translateY: floatAnim }, { scale: pulseAnim }],
          },
        ]}
      >
        <Ionicons
          name={
            isSearch
              ? "search-outline"
              : isToday
              ? "calendar-outline"
              : "document-outline"
          }
          size={36}
          color="#ffffff"
        />
      </Animated.View>

      {/* TITLE */}
      <Text style={styles.title}>
        {isSearch
          ? "Không tìm thấy kết quả"
          : isToday
          ? "Hôm nay chưa có yêu cầu nào"
          : "Chưa có yêu cầu nào"}
      </Text>

      {/* DESC */}
      <Text style={styles.desc}>
        {isSearch
          ? "Thử thay đổi từ khóa hoặc bộ lọc"
          : isToday
          ? "Bấm vào tab Tất cả để xem tất cả yêu cầu"
          : "Các yêu cầu mới sẽ hiển thị tại đây"}
      </Text>

      {/* CTA BUTTON (only today) */}
      {isToday && onAction && (
        <Text style={styles.action} onPress={onAction}>
          Xem tất cả
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 120,
    paddingHorizontal: 32,
  },

  // Subtle glowing background circle
  glowEffect: {
    position: 'absolute',
    top: 108,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    transform: [{ scale: 1.2 }],
  },

  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    // Gradient-like effect using layered backgrounds
    backgroundColor: '#6366f1', // Indigo-500 base
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,

    // Modern shadow with depth
    shadowColor: "#6366f1",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b", // Slate-800 for better readability
    marginBottom: 8,
    letterSpacing: -0.2,
    textAlign: 'center',
  },

  desc: {
    fontSize: 15,
    color: "#94a3b8", // Slate-400 for softer contrast
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
    letterSpacing: 0.1,
  },

  action: {
    marginTop: 20,
    fontSize: 15,
    fontWeight: "600",
    color: "#6366f1", // Matches icon color
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    letterSpacing: 0.2,
  },
});