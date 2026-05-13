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
    (type === "PERSONAL" || (type === "CUSTOMER" && images.length > 0));

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16 }}
      enableOnAndroid
      extraScrollHeight={120}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Chọn lý do hoàn đơn *</Text>

      <TouchableOpacity
        style={[styles.option, type === "CUSTOMER" && styles.optionActive]}
        onPress={() => setType("CUSTOMER")}
      >
        <Text style={styles.optionText}>Khách hàng không nhận</Text>

        <Text style={styles.optionDesc}>
          Cần chụp ảnh minh chứng tại địa điểm giao hàng
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.option, type === "PERSONAL" && styles.optionActive]}
        onPress={() => setType("PERSONAL")}
      >
        <Text style={styles.optionText}>Lý do cá nhân</Text>

        <Text style={styles.optionDesc}>
          Đơn này sẽ không được tính công giao hàng
        </Text>
      </TouchableOpacity>

      {type === "CUSTOMER" && (
        <>
          <Text style={styles.title}>Hình ảnh minh chứng *</Text>

          <View style={styles.imageRow}>
            {images.map((img, i) => (
              <Image key={i} source={{ uri: img.uri }} style={styles.image} />
            ))}
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.btn} onPress={takePhoto}>
              <Text>Chụp ảnh</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btn} onPress={pickImage}>
              <Text>Chọn ảnh</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Text style={styles.title}>Lý do chi tiết</Text>

      <TextInput
        value={reason}
        onChangeText={setReason}
        multiline
        placeholder="Ví dụ: Khách không nghe điện thoại..."
        style={styles.note}
      />

      <TouchableOpacity
        style={[
          styles.returnBtn,
          !isValid && styles.returnBtnDisabled,
          loading && { opacity: 0.7 },
        ]}
        onPress={submitReturn}
        disabled={!isValid || loading}
      >
        {loading ? (
          <Text style={{ color: "white", fontWeight: "600" }}>
            <ActivityIndicator color="#fff" /> {loadingText}
          </Text>
        ) : (
          <Text style={{ color: "white", fontWeight: "600" }}>
            Xác nhận hoàn đơn
          </Text>
        )}
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
  container: {
    flex: 1,
    padding: 16,
  },

  title: {
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
  },

  option: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },

  optionActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },

  optionText: {
    fontWeight: "700",
    marginBottom: 4,
  },

  optionDesc: {
    fontSize: 12,
    color: "#6b7280",
  },

  imageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  image: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },

  buttons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  btn: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },

  note: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
  },

  returnBtn: {
    marginTop: 30,
    backgroundColor: "#ef4444",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  returnBtnDisabled: {
    backgroundColor: "#9ca3af",
  },
});
