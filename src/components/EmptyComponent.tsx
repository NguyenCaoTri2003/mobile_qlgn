import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View, Animated, Easing } from "react-native";
import { useEffect, useRef } from "react";

export const EmptyState = ({ type = "default", onAction }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
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
          size={42}
          color="#6b7280"
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
    paddingHorizontal: 24,
  },

  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },

    elevation: 4,
  },

  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },

  desc: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
  },

  action: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
  },
});
