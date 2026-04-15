import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";

export default function ManagerSection() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* TITLE */}
      <Text style={styles.title}>Trưởng Phòng Giao Nhận</Text>

      {/* SECTION 1 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.stepBox}>
            <Text style={styles.stepText}>1</Text>
          </View>
          <Text style={styles.sectionTitle}>
            Điều phối nhân viên (Assign)
          </Text>
        </View>

        <Text style={styles.text}>
          Khi có yêu cầu mới trạng thái{" "}
          <Text style={styles.badgeRed}>Chờ tiếp nhận</Text>:
        </Text>

        <View style={styles.list}>
          <Text style={styles.listItem}>
            • Nhấp vào đơn hàng → chọn{" "}
            <Text style={styles.bold}>Điều phối nhân viên</Text>
          </Text>

          <Text style={styles.listItem}>
            • Hệ thống sẽ gợi ý danh sách nhân viên giao nhận đang rảnh trong ngày
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
            Yêu cầu bổ sung hồ sơ
          </Text>
        </View>

        <Text style={styles.text}>
          Nếu thông tin đơn hàng thiếu, bạn có thể nhập ghi chú và bấm{" "}
          <Text style={styles.bold}>Gửi yêu cầu bổ sung</Text> để trả lại cho Admin,
          trạng thái sẽ là{" "}
          <Text style={styles.badgeOrange}>Cần bổ sung</Text>.
        </Text>
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

  /* BADGES */
  badgeRed: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: "700",
  },

  badgeOrange: {
    backgroundColor: "#ffedd5",
    color: "#c2410c",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: "700",
  },
});