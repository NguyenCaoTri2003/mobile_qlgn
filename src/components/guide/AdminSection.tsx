import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";

export default function AdminSection() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* TITLE */}
      <Text style={styles.title}>
        Nhân Viên Admin (Chuyên môn)
      </Text>

      {/* SECTION 1 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.stepBox}>
            <Text style={styles.stepText}>1</Text>
          </View>
          <Text style={styles.sectionTitle}>Tạo yêu cầu mới</Text>
        </View>

        <Text style={styles.text}>
          Sử dụng nút{" "}
          <Text style={styles.bold}>"Tạo Yêu Cầu Mới"</Text> trên Dashboard
          hoặc Danh sách công dịch.
        </Text>

        {/* LIST */}
        <View style={styles.list}>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>Thông tin bắt buộc:</Text> Tên người
            giao, Loại yêu cầu, Công ty, MST, SĐT, Người liên lạc, Địa chỉ,
            Thời gian, Thông tin yêu cầu
          </Text>

          <Text style={styles.listItem}>
            • <Text style={styles.bold}>Hồ sơ đính kèm:</Text> Chọn hồ sơ cần
            giao/nhận. Có thể dùng{" "}
            <Text style={styles.bold}>"Thêm có sẵn"</Text> hoặc{" "}
            <Text style={styles.bold}>"+"</Text>
          </Text>

          <Text style={styles.listItem}>
            • <Text style={styles.bold}>Khác:</Text> Thu tiền, ghi chú, ảnh,
            file đính kèm
          </Text>
        </View>
      </View>

      {/* SECTION 2 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.stepBox}>
            <Text style={styles.stepText}>2</Text>
          </View>
          <Text style={styles.sectionTitle}>
            Theo dõi và Duyệt kết quả
          </Text>
        </View>

        <View style={styles.list}>
          <Text style={styles.listItem}>
            • Khi hoàn tất, trạng thái sẽ là{" "}
            <Text style={styles.badge}>Đã xong</Text>
          </Text>

          <Text style={styles.listItem}>
            • Kiểm tra ảnh hiện trường và chữ ký khách hàng
          </Text>

          <Text style={styles.listItem}>
            • Bấm <Text style={styles.bold}>Chấp Nhận Duyệt</Text> hoặc{" "}
            <Text style={styles.bold}>Không duyệt</Text>
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
    marginBottom: 10,
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
    fontWeight: "900",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },

  text: {
    color: "#555",
    marginBottom: 10,
    lineHeight: 20,
  },

  bold: {
    fontWeight: "700",
    color: "#111",
  },

  list: {
    marginTop: 6,
    gap: 8,
  },

  listItem: {
    color: "#555",
    lineHeight: 20,
  },

  badge: {
    backgroundColor: "#f3e8ff",
    color: "#7e22ce",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: "700",
  },
});