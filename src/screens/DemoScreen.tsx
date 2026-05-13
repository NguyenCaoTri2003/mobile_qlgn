import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface DonInfo {
  maDon: string;
  loaiDon: string;
  nguoiNhan: string;
  tenCongTy: string;
  diaChi: string;
  soDienThoai: string;
  danhSachTaiLieu: string[];
  ngayTao: string;
  nguoiTaoYeuCau: string;
  nhanVienGiaoNhan: string;
  maNhanVien: string;
  soDienThoaiNV: string;
  phuongTien: string;
  trangThai: string;
  ghiChu: string;
  thoiGianDuKien: string;
}

export const DemoScreen = () => {
  const [maDon, setMaDon] = useState("");
  const navigation = useNavigation();
  const [thongTinDon, setThongTinDon] = useState<DonInfo | null>(null);

  // Dữ liệu tĩnh mẫu
  const duLieuMau: Record<string, DonInfo> = {
    "123": {
      maDon: "123",
      loaiDon: "ĐƠN GIAO",
      nguoiNhan: "Nguyễn Văn An",
      tenCongTy: "Công ty TNHH ABC Việt Nam",
      diaChi: "123 Lê Lợi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh",
      soDienThoai: "0901234567",
      danhSachTaiLieu: [
        "Hồ sơ xin cấp giấy phép lao động",
        "Hộ chiếu bản sao công chứng",
        "Giấy khám sức khỏe bản gốc",
        "Lý lịch tư pháp bản gốc",
        "Bằng cấp chuyên môn bản sao công chứng",
        "Hợp đồng lao động bản sao",
        "Ảnh 4x6 (2 tấm)",
      ],
      ngayTao: "08/05/2026",
      nguoiTaoYeuCau: "Trần Thị Bình - Phòng Nhân sự",
      nhanVienGiaoNhan: "Lê Hoàng Phúc",
      maNhanVien: "NV056",
      soDienThoaiNV: "0912345678",
      phuongTien: "Xe máy - 59F1-234.56",
      trangThai: "ĐANG GIAO",
      ghiChu: "Giao trong giờ hành chính. Liên hệ trước 30 phút.",
      thoiGianDuKien: "09:30 - 11:00, 08/05/2026",
    },
  };

  const kiemTraMaDon = () => {
    const maDonTrimmed = maDon.trim();

    if (!maDonTrimmed) {
      Alert.alert("Thông báo", "Vui lòng nhập mã đơn hàng!");
      return;
    }

    const duLieu = duLieuMau[maDonTrimmed];

    if (duLieu) {
      setThongTinDon(duLieu);
    } else {
      Alert.alert(
        "Không tìm thấy",
        `Không tìm thấy đơn hàng với mã "${maDonTrimmed}"`,
      );
      setThongTinDon(null);
    }
  };

  const getTrangThaiColor = (trangThai: string) => {
    switch (trangThai) {
      case "ĐANG GIAO":
        return "#FF9800";
      case "ĐÃ GIAO":
        return "#4CAF50";
      case "CHỜ XỬ LÝ":
        return "#2196F3";
      default:
        return "#757575";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Quay lại</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Kiểm tra đơn</Text>
        <Text style={styles.headerSubtitle}>Giấy phép lao động</Text>
      </View>

      {/* Phần nhập mã đơn */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>Nhập mã đơn hàng:</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="VD: 123"
            placeholderTextColor="#999"
            value={maDon}
            onChangeText={setMaDon}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.searchButton} onPress={kiemTraMaDon}>
            <Text style={styles.searchButtonText}>🔍 Tra cứu</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hiển thị thông tin đơn hàng */}
      {thongTinDon && (
        <ScrollView
          style={styles.resultContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Card trạng thái */}
          <View
            style={[
              styles.statusCard,
              { borderLeftColor: getTrangThaiColor(thongTinDon.trangThai) },
            ]}
          >
            <View style={styles.statusHeader}>
              <Text style={styles.maDonText}>Đơn #{thongTinDon.maDon}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getTrangThaiColor(thongTinDon.trangThai) },
                ]}
              >
                <Text style={styles.statusText}>{thongTinDon.trangThai}</Text>
              </View>
            </View>
            <View style={styles.loaiDonContainer}>
              <Text style={styles.loaiDonText}>{thongTinDon.loaiDon}</Text>
            </View>
          </View>

          {/* Card người nhận */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>👤 THÔNG TIN NGƯỜI NHẬN</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Họ tên:</Text>
              <Text style={styles.infoValue}>{thongTinDon.nguoiNhan}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Công ty:</Text>
              <Text style={styles.infoValue}>{thongTinDon.tenCongTy}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Địa chỉ:</Text>
              <Text style={styles.infoValue}>{thongTinDon.diaChi}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>SĐT:</Text>
              <Text style={styles.infoValue}>{thongTinDon.soDienThoai}</Text>
            </View>
          </View>

          {/* Card tài liệu */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>📋 DANH SÁCH TÀI LIỆU CẦN GIAO</Text>
            {thongTinDon.danhSachTaiLieu.map((taiLieu, index) => (
              <View key={index} style={styles.documentItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.documentText}>{taiLieu}</Text>
              </View>
            ))}
          </View>

          {/* Card nhân viên giao nhận */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>🛵 NHÂN VIÊN GIAO NHẬN</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Họ tên:</Text>
              <Text style={styles.infoValue}>
                {thongTinDon.nhanVienGiaoNhan}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mã NV:</Text>
              <Text style={styles.infoValue}>{thongTinDon.maNhanVien}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>SĐT:</Text>
              <Text style={styles.infoValue}>{thongTinDon.soDienThoaiNV}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phương tiện:</Text>
              <Text style={styles.infoValue}>{thongTinDon.phuongTien}</Text>
            </View>
          </View>

          {/* Card thông tin thêm */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>📝 THÔNG TIN THÊM</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Người tạo:</Text>
              <Text style={styles.infoValue}>{thongTinDon.nguoiTaoYeuCau}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ngày tạo:</Text>
              <Text style={styles.infoValue}>{thongTinDon.ngayTao}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Thời gian dự kiến:</Text>
              <Text style={styles.infoValue}>{thongTinDon.thoiGianDuKien}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ghi chú:</Text>
              <Text style={styles.infoValue}>{thongTinDon.ghiChu}</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Hiển thị khi chưa có dữ liệu */}
      {!thongTinDon && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>
            Nhập mã đơn hàng để xem thông tin
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
   header: {
    backgroundColor: '#1976D2',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#E3F2FD',
    fontSize: 14,
    marginTop: 4,
  },
  
  inputSection: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: "#BDBDBD",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: "#1976D2",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  resultContainer: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  maDonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  loaiDonContainer: {
    marginTop: 8,
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  loaiDonText: {
    color: "#1976D2",
    fontSize: 13,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  infoLabel: {
    width: 110,
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  documentItem: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 5,
  },
  bullet: {
    fontSize: 14,
    color: "#1976D2",
    marginRight: 8,
    marginTop: 2,
  },
  documentText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});
