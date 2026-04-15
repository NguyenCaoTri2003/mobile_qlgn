import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function SidebarMenuGuide({ active, onSelect }: any) {
  const Item = (key: string, label: string, icon: string) => {
    const isActive = active === key;

    return (
      <TouchableOpacity
        onPress={() => onSelect(key)}
        style={[styles.item, isActive && styles.active]}
      >
        <View style={[styles.iconBox, isActive && styles.iconActive]}>
          <Text style={{ color: isActive ? "#fff" : "#333" }}>{icon}</Text>
        </View>
        <Text style={[styles.text, isActive && styles.textActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      {Item("overview", "Tổng Quan", "🏠")}
      <Text style={styles.group}>Quy trình theo vai trò</Text>
      {Item("role-admin", "Nhân Viên Admin", "👩‍💼")}
      {Item("role-ql", "Trưởng Phòng Giao Nhận", "👔")}
      {Item("role-shipper", "Nhân Viên Giao Nhận", "🚚")}
      <Text style={styles.group}>Từ điển dữ liệu</Text>
      {Item("fields", "Trường Thông Tin", "📋")}
      {Item("ui", "Giao Diện & Trạng Thái", "🎨")}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  name: {
    fontWeight: "700",
    fontSize: 14,
  },

  role: {
    fontSize: 12,
    color: "#777",
  },

  group: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1, // giãn chữ nhìn pro hơn
    fontWeight: "600",
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    marginBottom: 6,
  },

  active: {
    backgroundColor: "#eef2ff",
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  iconActive: {
    backgroundColor: "#2563eb",
  },

  text: {
    fontWeight: "600",
    color: "#333",
  },

  textActive: {
    color: "#2563eb",
  },
});
