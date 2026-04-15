import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

const fields = [
  {
    name: "Mã yêu cầu",
    desc: "Mã định danh duy nhất (VD: #240326-12-NguyenAn).",
    required: true,
  },
  {
    name: "Bộ phận",
    desc:
      "Bộ phận chuyên môn yêu cầu (Visa Việt Nam, Visa Nước Ngoài, Giấy phép lao động).",
    required: true,
  },
  {
    name: "Người yêu cầu",
    desc:
      "Nhân viên Admin tạo yêu cầu và phụ trách kiểm tra hồ sơ.",
    required: true,
  },
  {
    name: "Loại yêu cầu",
    desc:
      "Xác định hình thức giao nhận (Nhận hồ sơ hoặc Giao hồ sơ).",
    required: true,
  },
  {
    name: "Tên công ty/khách hàng",
    desc:
      "Tên doanh nghiệp hoặc cá nhân yêu cầu thực hiện giao nhận hồ sơ.",
    required: true,
  },
  {
    name: "Mã số thuế",
    desc:
      "Dùng để đối soát và lưu trữ thông tin doanh nghiệp.",
    required: false,
  },
  {
    name: "Số điện thoại",
    desc:
      "Liên hệ chính để xác nhận và hỗ trợ trong quá trình giao nhận.",
    required: true,
  },
  {
    name: "Tên người liên hệ",
    desc:
      "Người trực tiếp nhận/bàn giao hồ sơ tại địa điểm.",
    required: true,
  },
  {
    name: "Địa chỉ",
    desc:
      "Gồm số nhà, đường, phường/xã, quận/huyện. Có thể mở map để định vị.",
    required: true,
  },
  {
    name: "Ngày & giờ giao nhận",
    desc:
      "Thời gian dự kiến thực hiện để lên lịch và phân công.",
    required: true,
  },
  {
    name: "Thông tin yêu cầu",
    desc: "Mô tả ngắn gọn thông tin yêu cầu liên quan đến việc giao nhận hồ sơ.",
    required: true,
  },
  {
    name: "Thu/Thanh toán",
    desc:
      "Chọn có thu tiền hoặc thanh toán hay không. Nếu có, sẽ hiển thị thêm trường nhập số tiền và loại tiền tệ để điền thông tin chi tiết.",
    required: false,
  },
  {
    name: "Tiền (VND/USD)",
    desc:
      "Nhập số tiền (VND hoặc USD) nếu có thu hoặc thanh toán. Trường này chỉ hiển thị khi chọn \"Có\" ở trường Thu/Thanh toán.",
    required: false,
  },
  {
    name: "Checklist hồ sơ",
    desc: "Danh sách các hồ sơ/tài liệu cần giao nhận (checklist).",
    required: false,
  },
  {
    name: "Tài liệu đính kèm",
    desc: "Hình ảnh/file minh chứng (đóng gói, biên nhận, tình trạng hồ sơ...).",
    required: false,
  },
];

export default function FieldsSection() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* TITLE */}
      <Text style={styles.title}>Từ điển các trường thông tin</Text>

      {/* NOTE */}
      <Text style={styles.note}>
        <Text style={{ color: "#ef4444", fontWeight: "700" }}>*</Text> Các
        trường bắt buộc cần nhập để hệ thống xử lý yêu cầu.
      </Text>

      {/* LIST */}
      <View style={styles.list}>
        {fields.map((item, index) => (
          <View key={index} style={styles.card}>
            {/* HEADER */}
            <View style={styles.row}>
              <Text style={styles.fieldName}>{item.name}</Text>

              {item.required ? (
                <View style={styles.required}>
                  <Text style={styles.requiredText}>Bắt buộc</Text>
                </View>
              ) : (
                <View style={styles.optional}>
                  <Text style={styles.optionalText}>Không</Text>
                </View>
              )}
            </View>

            {/* DESC */}
            <Text style={styles.desc}>{item.desc}</Text>
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
    fontSize: 22,
    fontWeight: "900",
    color: "#111",
    marginBottom: 10,
    borderBottomWidth: 4,
    borderBottomColor: "#2563eb",
    alignSelf: "flex-start",
    paddingBottom: 4,
  },

  note: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 16,
  },

  list: {
    gap: 12,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  fieldName: {
    fontWeight: "800",
    color: "#2563eb",
    fontSize: 15,
    flex: 1,
    paddingRight: 8,
  },

  desc: {
    marginTop: 6,
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
  },

  required: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  requiredText: {
    color: "#dc2626",
    fontSize: 11,
    fontWeight: "700",
  },

  optional: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  optionalText: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "600",
  },
});