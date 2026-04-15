import React from "react";
import { View, StyleSheet } from "react-native";

export default function Skeleton({ width, height }: any) {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width || "100%",
          height: height || 20,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
  },
});