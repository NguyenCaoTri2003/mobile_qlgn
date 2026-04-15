import { EvilIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";

const { width } = Dimensions.get("window");

export default function ProfileDetailScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // intro animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // floating icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // pulse glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* BACKGROUND BLOBS */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: "center",
        }}
      >
        {/* ICON WITH GLOW */}
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              transform: [
                { translateY: floatAnim },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          <EvilIcons name="lock" size={90} color="#fff" />
        </Animated.View>

        {/* TITLE */}
        <Text style={styles.title}>Chưa mở khoá 🔒</Text>

        {/* DESC */}
        <Text style={styles.description}>
          Tính năng này đang được hoàn thiện.
          {"\n"}Sẽ có mặt trong bản cập nhật sắp tới.
        </Text>

        {/* BUTTON */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
          style={styles.buttonWrapper}
        >
          <LinearGradient
            colors={["#2563eb", "#7c3aed"]}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Quay lại</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },

  // BLOBS (background shape)
  blob1: {
    position: "absolute",
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: "#2563eb",
    borderRadius: 999,
    top: -100,
    left: -80,
    opacity: 0.2,
  },

  blob2: {
    position: "absolute",
    width: width * 0.7,
    height: width * 0.7,
    backgroundColor: "#ec4899",
    borderRadius: 999,
    bottom: -120,
    right: -80,
    opacity: 0.2,
  },

  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,

    shadowColor: "#2563eb",
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#f9fafb",
    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    color: "#cbd5f5",
    textAlign: "center",
    lineHeight: 22,
  },

  buttonWrapper: {
    marginTop: 32,
  },

  button: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 999,
  },

  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});