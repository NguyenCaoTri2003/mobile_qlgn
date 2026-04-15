import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import Signature from "react-native-signature-canvas";

import { orderService } from "../services/order.service";
import { useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system/legacy";
import AppNotification from "../components/AppNotification";
import { ActivityIndicator } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const MAX_SIZE = 5 * 1024 * 1024;

export default function CompleteOrderScreen({ route }: any) {
  const { id, attachments, missingNote } = route.params;
  const navigation = useNavigation();
  const [notify, setNotify] = useState({
    visible: false,
    type: "success" as "success" | "error",
    message: "",
  });

  const [images, setImages] = useState<any[]>([]);
  // const [signature, setSignature] = useState<any>(null);
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Đang xử lý...");

  const signRef = useRef<any>(null);

  const locationPromise = useRef<Promise<any> | null>(null);

  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const validateImage = async (asset: any) => {
    const info = await FileSystem.getInfoAsync(asset.uri);

    if (info.exists && info.size && info.size > MAX_SIZE) {
      setNotify({
        visible: true,
        type: "error",
        message: "Ảnh không được vượt quá 5MB",
      });
      return false;
    }

    return true;
  };

  const compressImage = async (uri: string) => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1000 } }],
      {
        compress: 0.6,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    return result;
  };

  const takePhoto = async () => {
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!res.canceled) {
      const asset = res.assets[0];

      if (!(await validateImage(asset))) return;

      const compressed = await compressImage(asset.uri);

      // setImages((prev) => [...prev, asset]);
      setImages((prev) => [...prev, compressed]);
    }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
    });

    if (!res.canceled) {
      const asset = res.assets[0];

      if (!(await validateImage(asset))) return;

      const compressed = await compressImage(asset.uri);

      // setImages((prev) => [...prev, asset]);
      setImages((prev) => [...prev, compressed]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const clearSignature = () => {
    signRef.current?.clearSignature();
    // setSignature(null);
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

  // const completeOrder = () => {
  //   if (loading) return;

  //   if (images.length === 0) {
  //     setNotify({
  //       visible: true,
  //       type: "error",
  //       message: "Cần ít nhất 1 hình ảnh chứng từ",
  //     });
  //     return;
  //   }

  //   setLoading(true);
  //   setLoadingText("Đang lấy vị trí GPS...");

  //   locationPromise.current = getLocation();

  //   signRef.current?.readSignature();
  // };

  const completeOrder = async () => {
    if (loading) return;

    if (images.length === 0) {
      setNotify({
        visible: true,
        type: "error",
        message: "Cần ít nhất 1 hình ảnh chứng từ",
      });
      return;
    }

    if (!signaturePreview) {
      setNotify({
        visible: true,
        type: "error",
        message: "Cần chữ ký khách hàng",
      });
      return;
    }

    try {
      setLoading(true);
      setLoadingText("Đang lấy vị trí GPS...");

      const location = await getLocation();

      if (!location) {
        setLoading(false);
        return;
      }

      // 👉 xử lý chữ ký
      setLoadingText("Đang ghi chữ ký...");

      const base64 = signaturePreview.replace("data:image/png;base64,", "");

      const fileUri = FileSystem.cacheDirectory + "signature.png";

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 👉 upload
      setLoadingText("Đang upload dữ liệu...");

      await orderService.shipperComplete(
        id,
        images,
        location,
        {
          uri: fileUri,
          type: "image/png",
          fileName: "signature.png",
        },
        note,
        attachments,
        missingNote,
      );

      setNotify({
        visible: true,
        type: "success",
        message: "Xác nhận hoàn tất đơn hàng thành công",
      });

      navigation.navigate("OrderList" as never);
    } catch (err) {
      setNotify({
        visible: true,
        type: "error",
        message: "Xác nhận hoàn tất đơn hàng thất bại",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignature = async (sig: string) => {
    setSignaturePreview(sig);
    setShowSignModal(false);
  };

  const isValid = images.length > 0 && !!signaturePreview;

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16 }}
      enableOnAndroid
      extraScrollHeight={120}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={scrollEnabled}
    >
      <Text style={styles.title}>Hình ảnh chứng từ *</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 10 }}
      >
        <View style={{ flexDirection: "row", gap: 10 }}>
          {images.map((img, i) => (
            <View key={i} style={styles.imageWrapper}>
              <Image source={{ uri: img.uri }} style={styles.image} />

              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeImage(i)}
              >
                <Text style={{ color: "white", fontSize: 12 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btn} onPress={takePhoto}>
          <Text>Chụp ảnh</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={pickImage}>
          <Text>Chọn ảnh</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Chữ ký khách hàng *</Text>

      {signaturePreview ? (
        <View style={{ alignItems: "center", marginBottom: 10 }}>
          <View style={styles.signaturePreviewBox}>
            <Image
              source={{ uri: signaturePreview }}
              style={styles.signaturePreviewImage}
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowSignModal(true)}
            style={[styles.btn, { marginTop: 8 }]}
          >
            <Text>Ký lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.btn}
          onPress={() => setShowSignModal(true)}
        >
          <Text>Thêm chữ ký</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.title}>Ghi chú</Text>

      <TextInput
        value={note}
        onChangeText={setNote}
        multiline
        placeholder="Ghi chú nếu cần..."
        style={styles.note}
      />

      <TouchableOpacity
        style={[
          styles.completeBtn,
          (!isValid || loading) && {
            opacity: 0.5,
            backgroundColor: "#9ca3af",
          },
        ]}
        onPress={completeOrder}
        disabled={!isValid || loading}
      >
        {loading ? (
          <Text style={{ color: "white", fontWeight: "600" }}>
            <ActivityIndicator color="#fff" /> {loadingText}
          </Text>
        ) : (
          <Text style={{ color: "white", fontWeight: "600" }}>
            Xác nhận hoàn tất
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

      <Modal visible={showSignModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.signatureTitle}>Vui lòng ký tên</Text>

            <View style={styles.signatureBox}>
              <Signature
                ref={signRef}
                onOK={(sig) => {
                  setSignaturePreview(sig);
                  setShowSignModal(false);
                }}
                onEmpty={() => {
                  setNotify({
                    visible: true,
                    type: "error",
                    message: "Vui lòng ký trước khi xác nhận",
                  });
                }}
                descriptionText="Ký tại đây"
                clearText="Xoá"
                confirmText="Đồng ý"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowSignModal(false)}
                style={styles.modalBtn}
              >
                <Text>Đóng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={clearSignature}
                style={styles.modalBtn}
              >
                <Text>Xoá</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => signRef.current?.readSignature()}
                style={[styles.modalBtn, { backgroundColor: "#16a34a" }]}
              >
                <Text style={{ color: "#fff" }}>Đồng ý</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  completeBtn: {
    marginTop: 30,
    backgroundColor: "#16a34a",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  imageWrapper: {
    position: "relative",
    overflow: "visible",
    marginRight: 10,
  },

  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "red",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  signatureCard: {
    marginTop: 20,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  signatureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  signatureTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: "#111",
  },

  signatureBox: {
    height: 250,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#fafafa",
  },

  clearBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },

  clearBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },

  signaturePreviewBox: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  signaturePreviewImage: {
    width: 200,
    height: 100,
    resizeMode: "contain",
  },
});
