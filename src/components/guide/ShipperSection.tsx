import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function ShipperSection() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* TITLE */}
      <Text style={styles.title}>Nhân Viên Giao Nhận</Text>

      {/* SECTION 1 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.stepBox}>
            <Text style={styles.stepText}>1</Text>
          </View>
          <Text style={styles.sectionTitle}>
            Sắp xếp lộ trình (Mobile)
          </Text>
        </View>

        <Text style={styles.text}>
          Tại danh sách công việc, bạn có thể{" "}
          <Text style={styles.bold}>kéo và thả (Drag & Drop)</Text> các thẻ
          đơn hàng để sắp xếp thứ tự đi giao ưu tiên cho bản thân.
        </Text>
      </View>

      {/* SECTION 2 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.stepBox}>
            <Text style={styles.stepText}>2</Text>
          </View>
          <Text style={styles.sectionTitle}>
            Thao tác tại hiện trường
          </Text>
        </View>

        <View style={styles.list}>
          <Text style={styles.item}>
            • <Text style={styles.bold}>Nhận đơn:</Text> Kiểm tra thực tế hồ sơ,
            tích chọn vào checklist trong app.
          </Text>

          <Text style={styles.item}>
            • <Text style={styles.bold}>Báo thiếu:</Text> Nếu hồ sơ khách đưa
            không đủ, dùng{" "}
            <Text style={styles.bold}>"Báo thiếu hồ sơ"</Text> để hệ thống ghi nhận.
          </Text>

          <Text style={styles.item}>
            • <Text style={styles.bold}>Hoàn tất:</Text> Chụp ảnh hiện trường
            (tối thiểu 1 ảnh), lấy chữ ký khách hàng trực tiếp trên màn hình,
            và xác nhận vị trí GPS.
          </Text>
        </View>
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
    marginBottom: 20,
    borderBottomWidth: 4,
    borderBottomColor: "#2563eb",
    alignSelf: "flex-start",
    paddingBottom: 4,
  },

  section: {
    marginBottom: 28,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  stepBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  stepText: {
    color: "#2563eb",
    fontWeight: "800",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },

  text: {
    color: "#555",
    fontSize: 14,
    lineHeight: 20,
  },

  list: {
    gap: 10,
  },

  item: {
    color: "#555",
    fontSize: 14,
    lineHeight: 20,
  },

  bold: {
    fontWeight: "700",
    color: "#111",
  },
});