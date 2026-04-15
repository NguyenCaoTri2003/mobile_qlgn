import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function NotificationCard({ item, onPress }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const isUnread = item.read_status === 0;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View
        style={[
          styles.card,
          { transform: [{ scale }] },
          isUnread && styles.unread,
        ]}
      >
        {/* ICON */}
        <View
          style={[
            styles.iconBox,
            { backgroundColor: isUnread ? "#dbeafe" : "#f1f5f9" },
          ]}
        >
          <Ionicons
            name={isUnread ? "notifications" : "notifications-outline"}
            size={20}
            color={isUnread ? "#2563eb" : "#6b7280"}
          />
        </View>

        {/* CONTENT */}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.message}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>

        {/* DOT */}
        {isUnread && <View style={styles.dot} />}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: 14,
    marginHorizontal: 14,
    marginVertical: 6,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#f1f5f9",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  unread: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  title: {
    fontWeight: "600",
    fontSize: 14,
  },

  time: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563eb",
  },
});