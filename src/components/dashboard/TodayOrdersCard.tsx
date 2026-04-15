import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Skeleton from "../Skeleton";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

export default function TodayOrdersCard({ orders, loading }: any) {
  const navigation: any = useNavigation();

  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 400 });
    opacity.value = withTiming(1, { duration: 400 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleOpen = (item: any) => {
    navigation.navigate("Orders", {
      screen: "OrderDetail",
      params: { id: Number(item.id) },
    });
  };

  if (loading) {
    return (
      <View style={styles.wrapper}>
        <Skeleton height={140} />
      </View>
    );
  }

  if (!orders || orders.length === 0) return null;

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      {/* GRADIENT BORDER */}
      <LinearGradient
        colors={["#3b82f6", "#8b5cf6", "#22c55e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={styles.inner}>
          <Text style={styles.title}>🚚 Đơn đang thực hiện hôm nay</Text>

          {orders.map((o: any, index: number) => {
            const isFirst = index === 0;

            return (
              <TouchableOpacity
                key={o.id}
                style={[styles.item, isFirst && styles.firstItem]}
                onPress={() => handleOpen(o)}
              >
                {/* TIME */}
                <View style={styles.timeBox}>
                  <Text style={styles.time}>{o.time}</Text>
                </View>

                {/* INFO */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.company} numberOfLines={2}>
                    {o.company}
                  </Text>

                  <Text style={styles.name} numberOfLines={1}>
                    {o.contact}
                  </Text>

                  <Text style={styles.phone}>{o.phone}</Text>

                  <Text style={styles.address} numberOfLines={1}>
                    {o.address}
                  </Text>
                </View>

                {/* RIGHT SIDE */}
                <View style={styles.right}>
                  {o.priority === "HIGH" && (
                    <Text style={styles.priority}>🔥</Text>
                  )}
                </View>

                {/* DIVIDER */}
                {index !== orders.length - 1 && <View style={styles.divider} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },

  gradientBorder: {
    borderRadius: 20,
    padding: 1.5,
  },

  inner: {
    borderRadius: 18,
    backgroundColor: "#ffffff",
    padding: 14,
  },

  title: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 12,
    color: "#0f172a",
  },

  item: {
    paddingVertical: 10,
  },

  firstItem: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 10,
  },

  timeBox: {
    position: "absolute",
    left: 0,
    top: 10,

    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",

    justifyContent: "center",
    alignItems: "center",
  },

  time: {
    fontWeight: "800",
    fontSize: 13,
    color: "#0f172a",
  },

  company: {
    marginLeft: 62,
    fontWeight: "700",
    fontSize: 14,
    color: "#1e3a8a",
  },

  name: {
    marginLeft: 62,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  phone: {
    marginLeft: 62,
    fontSize: 12,
    color: "#64748b",
  },

  address: {
    marginLeft: 62,
    fontSize: 12,
    color: "#94a3b8",
  },

  right: {
    position: "absolute",
    right: 0,
    top: 10,
    alignItems: "flex-end",
  },

  priority: {
    fontSize: 18,
  },

  nextText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginTop: 10,
  },
});
