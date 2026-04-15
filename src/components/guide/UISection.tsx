import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

const STATUS_LIST = [
  {
    label: "Chờ tiếp nhận",
    description: "Mới tạo, chưa có nhân viên giao nhận.",
    color: "#ef4444",
    bg: "#fee2e2",
  },
  {
    label: "Đã điều phối",
    description: "Đã giao cho nhân viên giao nhận.",
    color: "#3b82f6",
    bg: "#dbeafe",
  },
  {
    label: "Đang thực hiện",
    description: "Nhân viên đã xác nhận đi đơn này.",
    color: "#eab308",
    bg: "#fef9c3",
  },
  {
    label: "Cần bổ sung",
    description: "Yêu cầu bổ sung hồ sơ/thông tin.",
    color: "#f97316",
    bg: "#ffedd5",
  },
  {
    label: "Đã xong",
    description: "Đã hoàn tất, chờ duyệt.",
    color: "#a855f7",
    bg: "#f3e8ff",
  },
  {
    label: "Đã từ chối",
    description: "Nhân viên từ chối yêu cầu.",
    color: "#6b7280",
    bg: "#f3f4f6",
  },
  {
    label: "Hoàn tất",
    description: "Admin đã duyệt thành công.",
    color: "#22c55e",
    bg: "#dcfce7",
  },
  {
    label: "Chưa hoàn thành",
    description: "Admin xác nhận chưa thành công.",
    color: "#ef4444",
    bg: "#fef2f2",
  },
  {
    label: "Hoàn đơn (Khách)",
    description: "Khách hàng yêu cầu hoàn hồ sơ.",
    color: "#dc2626",
    bg: "#fee2e2",
  },
  {
    label: "Hoàn đơn (NV)",
    description: "Nhân viên trả lại đơn.",
    color: "#374151",
    bg: "#e5e7eb",
  },
];

export default function UISection() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* TITLE */}
      <Text style={styles.title}>Giao diện & Trạng thái</Text>

      {/* GRID */}
      <View style={styles.grid}>
        {STATUS_LIST.map((item, index) => (
          <View
            key={index}
            style={[styles.card, { backgroundColor: item.bg }]}
          >
            {/* DOT */}
            <View style={styles.row}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: item.color },
                ]}
              />

              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: item.color }]}>
                  {item.label}
                </Text>

                <Text style={[styles.desc, { color: item.color }]}>
                  {item.description}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111",
    marginBottom: 16,
    borderBottomWidth: 4,
    borderBottomColor: "#2563eb",
    alignSelf: "flex-start",
    paddingBottom: 4,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  card: {
    width: "48%",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
    marginTop: 4,
  },

  label: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  desc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
});