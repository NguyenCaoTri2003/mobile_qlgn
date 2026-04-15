import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function StatCard({ title, value, color, icon, onPress }: any) {
  const scale = useRef(new Animated.Value(1)).current;

  const [active, setActive] = useState(false);

  const pressIn = () => {
    setActive(true);

    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    setActive(false);

    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={styles.cardWrapper}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale }],
            borderColor: active ? color : color + "30",
            shadowColor: color,
            shadowOpacity: active ? 0.25 : 0.05,
            shadowRadius: active ? 16 : 8,
          },
        ]}
      >
        <View style={[styles.iconBox, { backgroundColor: color + "15" }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>

        <Text style={[styles.number, { color }]}>{value ?? 0}</Text>
        <Text style={styles.label}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: "48%",
  },

  card: {
    width: "100%",
    backgroundColor: "#fff",
    paddingVertical: 22,
    borderRadius: 20,
    marginBottom: 14,
    alignItems: "center",

    borderWidth: 1.5,
    borderColor: "#e5e7eb",

    elevation: 3,
  },

  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  number: {
    fontSize: 26,
    fontWeight: "700",
  },

  label: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
});
