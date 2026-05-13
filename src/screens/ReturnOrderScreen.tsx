import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import { orderService } from "../services/order.service";
import { useNavigation } from "@react-navigation/native";
import AppNotification from "../components/AppNotification";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { stopTracking } from "../services/location-tracking.service";

export default function ReturnOrderScreen({ route }: any) {
  const { id } = route.params;
  const navigation = useNavigation();

  const [notify, setNotify] = useState({
    visible: false,
    type: "success" as "success" | "error",
    message: "",
  });

  const [images, setImages] = useState<any[]>([]);
  const [reason, setReason] = useState("");
  const [reasonTouched, setReasonTouched] = useState(false); // Thêm state touched
  const [type, setType] = useState<"CUSTOMER" | "PERSONAL" | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Đang xử lý...");

  const takePhoto = async () => {
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!res.canceled) {
      setImages([...images, res.assets[0]]);
    }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
    });

    if (!res.canceled) {
      setImages([...images, res.assets[0]]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setNotify({
          visible: true,
          type: "error",
          message: "Không có quyền định vị",
        });
        return null;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      };
    } catch (err) {
      setNotify({
        visible: true,
        type: "error",
        message: "Không lấy được vị trí",
      });
      return null;
    }
  };

  const submitReturn = async () => {
    // Set touched để hiện lỗi nếu bấm submit mà chưa nhập
    setReasonTouched(true);

    if (!type) {
      setNotify({
        visible: true,
        type: "error",
        message: "Chọn lý do hoàn đơn",
      });
      return;
    }

    if (type === "CUSTOMER" && images.length === 0) {
      setNotify({
        visible: true,
        type: "error",
        message: "Cần ít nhất 1 hình ảnh chứng từ",
      });
      return;
    }

    // Validation bắt buộc nhập lý do
    if (!reason.trim()) {
      setNotify({
        visible: true,
        type: "error",
        message: "Vui lòng nhập lý do chi tiết",
      });
      return;
    }

    setLoading(true);
    setLoadingText("Đang lấy vị trí GPS...");

    const location = await getLocation();

    if (!location) {
      setLoading(false);
      return;
    }

    const status =
      type === "CUSTOMER" ? "RETURNED_CUSTOMER" : "RETURNED_PERSONAL";

    try {
      setLoadingText("Đang upload dữ liệu...");
      await orderService.shipperReturn(id, status, images, location, reason);

      stopTracking();

      setNotify({
        visible: true,
        type: "success",
        message: "Hoàn lại đơn hàng thành công",
      });

      navigation.navigate("OrderList" as never);
    } catch (err: any) {
      console.log(err?.response?.data || err);
      setNotify({
        visible: true,
        type: "error",
        message: "Hoàn lại đơn hàng thất bại",
      });
    } finally {
      setLoading(false);
      setLoadingText("Đang xử lý...");
    }
  };

  const isValid =
    type !== null &&
    reason.trim().length > 0 &&
    (type === "PERSONAL" || (type === "CUSTOMER" && images.length > 0));

  // Chỉ hiện lỗi khi đã touched và chưa nhập
  const showReasonError = reasonTouched && reason.trim().length === 0;

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      contentContainerStyle={{ padding: 12 }}
      enableOnAndroid
      extraScrollHeight={100}
      keyboardShouldPersistTaps="handled"
    >
      {/* Chọn lý do hoàn đơn */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
          <Text style={styles.sectionTitle}>Chọn lý do hoàn đơn *</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.optionCard,
            type === "CUSTOMER" && styles.optionCardActive,
          ]}
          onPress={() => setType("CUSTOMER")}
          activeOpacity={0.7}
        >
          <View style={styles.optionIconContainer}>
            <LinearGradient
              colors={
                type === "CUSTOMER"
                  ? ["#EF4444", "#DC2626"]
                  : ["#F1F5F9", "#E2E8F0"]
              }
              style={styles.optionIcon}
            >
              <Ionicons
                name="people-outline"
                size={20}
                color={type === "CUSTOMER" ? "#FFFFFF" : "#64748B"}
              />
            </LinearGradient>
          </View>
          <View style={styles.optionContent}>
            <Text
              style={[
                styles.optionTitle,
                type === "CUSTOMER" && styles.optionTitleActive,
              ]}
            >
              Khách hàng không nhận
            </Text>
            <Text style={styles.optionDesc}>
              Cần chụp ảnh minh chứng tại địa điểm giao hàng. Đơn sẽ được gửi về cho Trưởng phòng giao nhận để xử lý tiếp
            </Text>
          </View>
          {type === "CUSTOMER" && (
            <Ionicons name="checkmark-circle" size={22} color="#EF4444" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionCard,
            type === "PERSONAL" && styles.optionCardActive,
          ]}
          onPress={() => setType("PERSONAL")}
          activeOpacity={0.7}
        >
          <View style={styles.optionIconContainer}>
            <LinearGradient
              colors={
                type === "PERSONAL"
                  ? ["#F59E0B", "#D97706"]
                  : ["#F1F5F9", "#E2E8F0"]
              }
              style={styles.optionIcon}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={type === "PERSONAL" ? "#FFFFFF" : "#64748B"}
              />
            </LinearGradient>
          </View>
          <View style={styles.optionContent}>
            <Text
              style={[
                styles.optionTitle,
                type === "PERSONAL" && styles.optionTitleActive,
              ]}
            >
              Lý do cá nhân
            </Text>
            <Text style={styles.optionDesc}>
              Đơn sẽ được gửi về cho Trưởng phòng giao nhận để xử lý tiếp
            </Text>
          </View>
          {type === "PERSONAL" && (
            <Ionicons name="checkmark-circle" size={22} color="#F59E0B" />
          )}
        </TouchableOpacity>
      </View>

      {/* Hình ảnh minh chứng */}
      {type === "CUSTOMER" && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="camera-outline" size={18} color="#EF4444" />
            <Text style={styles.sectionTitle}>Hình ảnh minh chứng *</Text>
          </View>

          {images.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 8 }}
            >
              <View style={{ flexDirection: "row", gap: 8 }}>
                {images.map((img, i) => (
                  <View key={i} style={styles.imageWrapper}>
                    <Image source={{ uri: img.uri }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeImage(i)}
                    >
                      <Ionicons name="close" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={takePhoto}>
              <Ionicons name="camera" size={16} color="#EF4444" />
              <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>
                Chụp ảnh
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
              <Ionicons name="image-outline" size={16} color="#8B5CF6" />
              <Text style={[styles.actionBtnText, { color: "#8B5CF6" }]}>
                Chọn ảnh
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Lý do chi tiết */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text-outline" size={18} color="#6366F1" />
          <Text style={styles.sectionTitle}>Lý do chi tiết *</Text>
        </View>

        <TextInput
          value={reason}
          onChangeText={(text) => {
            setReason(text);
            // Khi bắt đầu nhập, đánh dấu đã touched
            if (!reasonTouched) setReasonTouched(true);
          }}
          onBlur={() => setReasonTouched(true)} // Khi blur khỏi input
          multiline
          placeholder="Ví dụ: Khách không nghe điện thoại..."
          placeholderTextColor="#94A3B8"
          style={[
            styles.noteInput,
            showReasonError && styles.noteInputError, // Chỉ hiện đỏ khi touched và trống
          ]}
        />
        {showReasonError && (
          <Text style={styles.requiredHint}>* Bắt buộc nhập lý do chi tiết</Text>
        )}
      </View>

      {/* Nút xác nhận */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          (!isValid || loading) && styles.submitBtnDisabled,
        ]}
        onPress={submitReturn}
        disabled={!isValid || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            !isValid || loading
              ? ["#94A3B8", "#64748B"]
              : ["#EF4444", "#DC2626"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.submitGradient}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.submitText}> {loadingText}</Text>
            </>
          ) : (
            <>
              <Ionicons name="return-down-back-outline" size={20} color="#FFFFFF" />
              <Text style={styles.submitText}> Xác nhận hoàn đơn</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <AppNotification
        visible={notify.visible}
        type={notify.type}
        message={notify.message}
        onHide={() =>
          setNotify((prev) => ({
            ...prev,
            visible: false,
          }))
        }
      />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },

  // Option Cards
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    gap: 12,
  },

  optionCardActive: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },

  optionIconContainer: {
    flexShrink: 0,
  },

  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 3,
  },

  optionTitleActive: {
    color: "#DC2626",
  },

  optionDesc: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
  },

  // Images
  imageWrapper: {
    position: "relative",
  },

  image: {
    width: 75,
    height: 75,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },

  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  actionBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Note Input
  noteInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 10,
    minHeight: 70,
    fontSize: 13,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
    textAlignVertical: "top",
  },

  noteInputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },

  requiredHint: {
    fontSize: 11,
    color: "#EF4444",
    marginTop: 4,
    fontWeight: "500",
  },

  // Submit Button
  submitBtn: {
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 4,
  },

  submitBtnDisabled: {
    opacity: 0.6,
    shadowColor: "#94A3B8",
  },

  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});