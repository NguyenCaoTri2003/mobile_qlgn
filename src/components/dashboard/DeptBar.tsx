import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function DeptBar({ name, count, total, color }: any) {
  const percent = total ? Math.min((count / total) * 100, 100) : 0;

  const widthAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // progress animation
  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: percent,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percent]);

  // shimmer animation (chạy lòng vòng)
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 150],
  });

  return (
    <View style={{ marginBottom: 20 }}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.count}>{count ?? 0} đơn</Text>
      </View>

      {/* GRADIENT BORDER */}
      <LinearGradient
        colors={["#60a5fa", "#a78bfa", "#34d399"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.borderWrap}
      >
        <View style={styles.progressBg}>
          {/* PROGRESS */}
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: widthAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
                backgroundColor: color,
              },
            ]}
          >
            {/* SHIMMER EFFECT */}
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX }],
                },
              ]}
            >
              <LinearGradient
                colors={["transparent", "rgba(255,255,255,0.5)", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  name: {
    fontWeight: "700",
    fontSize: 14,
    color: "#111827",
  },

  count: {
    fontSize: 12,
    color: "#6b7280",
  },

  borderWrap: {
    padding: 2,
    borderRadius: 12,
  },

  progressBg: {
    height: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
    overflow: "hidden",
  },

  shimmer: {
    position: "absolute",
    width: 80,
    height: "100%",
  },
});