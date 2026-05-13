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
// import { Audio } from "expo-av";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const MAX_SIZE = 5 * 1024 * 1024;

export default function CompleteOrderScreen({ route }: any) {
  const { id, attachments, missingNote, orderType } = route.params;

  console.log("type: ", route.params);
  const navigation = useNavigation();
  const [notify, setNotify] = useState({
    visible: false,
    type: "success" as "success" | "error",
    message: "",
  });

  const [images, setImages] = useState<any[]>([]);
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Đang xử lý...");

  const signRef = useRef<any>(null);

  const locationPromise = useRef<Promise<any> | null>(null);

  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  // const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [finalDuration, setFinalDuration] = useState(0);
  const intervalRef = useRef<any>(null);

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

  // const startRecording = async () => {
  //   try {
  //     const permission = await Audio.requestPermissionsAsync();
  //     if (!permission.granted) {
  //       setNotify({
  //         visible: true,
  //         type: "error",
  //         message: "Không có quyền microphone",
  //       });
  //       return;
  //     }

  //     await Audio.setAudioModeAsync({
  //       allowsRecordingIOS: true,
  //       playsInSilentModeIOS: true,
  //     });

  //     const { recording } = await Audio.Recording.createAsync(
  //       Audio.RecordingOptionsPresets.HIGH_QUALITY,
  //     );

  //     setRecording(recording);
  //     setIsRecording(true);
  //     setRecordDuration(0);

  //     intervalRef.current = setInterval(() => {
  //       setRecordDuration((prev) => prev + 1);
  //     }, 1000);
  //   } catch (err) {
  //     console.log("startRecording error:", err);
  //   }
  // };

  // const stopRecording = async () => {
  //   try {
  //     if (!recording) return;

  //     await recording.stopAndUnloadAsync();

  //     const uri = recording.getURI();

  //     const status = await recording.getStatusAsync();

  //     setFinalDuration(Math.floor((status.durationMillis || 0) / 1000));

  //     setAudioUri(uri || null);
  //     setRecording(null);
  //     setIsRecording(false);

  //     if (intervalRef.current) {
  //       clearInterval(intervalRef.current);
  //     }
  //   } catch (err) {
  //     console.log("stopRecording error:", err);
  //   }
  // };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // const toggleRecording = () => {
  //   if (isRecording) {
  //     stopRecording();
  //   } else {
  //     startRecording();
  //   }
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

    if (orderType === "PICKUP" && !signaturePreview) {
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

      setLoadingText("Đang upload dữ liệu...");

      let signatureFile = undefined;

      if (signaturePreview) {
        const base64 = signaturePreview.replace("data:image/png;base64,", "");

        const fileUri = FileSystem.cacheDirectory + "signature.png";

        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        signatureFile = {
          uri: fileUri,
          type: "image/png",
          fileName: "signature.png",
        };
      }

      await orderService.shipperComplete(
        id,
        images,
        location,
        signatureFile,
        audioUri
          ? {
              uri: audioUri,
              type: "audio/m4a",
              name: `audio-${Date.now()}.m4a`,
            }
          : null,
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
      console.log("error completed: ", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignature = async (sig: string) => {
    setSignaturePreview(sig);
    setShowSignModal(false);
  };

  const isValid =
    images.length > 0 && (orderType === "DELIVERY" || !!signaturePreview);

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

      <Text style={styles.title}>
        Chữ ký khách hàng {orderType === "PICKUP" ? "*" : ""}
      </Text>

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

      {/* <View style={styles.audioContainer}>
        <Text style={styles.audioLabel}>Ghi chú bằng giọng nói</Text>

        <View style={styles.audioRow}>
          <TouchableOpacity
            onPress={toggleRecording}
            style={[styles.micButton, isRecording && styles.micRecording]}
          >
            <Ionicons
              name={isRecording ? "stop" : "mic"}
              size={22}
              color="#fff"
            />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            {isRecording && (
              <Text style={styles.recordingText}>
                🔴 Đang ghi... {formatTime(recordDuration)}
              </Text>
            )}

            {audioUri && !isRecording && (
              <Text style={styles.recordedText}>
                Đã ghi: {formatTime(finalDuration)}
              </Text>
            )}
          </View>

          {audioUri && !isRecording && (
            <TouchableOpacity
              onPress={async () => {
                const { sound } = await Audio.Sound.createAsync({
                  uri: audioUri,
                });
                await sound.playAsync();
              }}
              style={styles.playButton}
            >
              <Ionicons name="play" size={20} color="#fff" />
            </TouchableOpacity>
          )}

          {audioUri && !isRecording && (
            <TouchableOpacity
              onPress={() => setAudioUri(null)}
              style={styles.deleteButton}
            >
              <MaterialIcons name="delete" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View> */}

      <TouchableOpacity
        style={[
          styles.completeBtn,
          (!isValid || loading || isRecording) && styles.disabledBtn,
        ]}
        onPress={completeOrder}
        disabled={!isValid || loading || isRecording}
      >
        {isRecording ? (
          <Text style={styles.completeText}>🎤 Đang ghi âm...</Text>
        ) : loading ? (
          <Text style={styles.completeText}>
            <ActivityIndicator color="#fff" /> {loadingText}
          </Text>
        ) : (
          <Text style={styles.completeText}>Xác nhận hoàn tất</Text>
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

  audioContainer: {
    marginTop: 15,
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  audioLabel: {
    fontWeight: "600",
    marginBottom: 8,
    color: "#374151",
  },

  audioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  micButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },

  micRecording: {
    backgroundColor: "#ef4444",
  },

  micIcon: {
    fontSize: 20,
    color: "#fff",
  },

  recordingText: {
    color: "#ef4444",
    fontWeight: "600",
  },

  recordedText: {
    color: "#16a34a",
    fontWeight: "600",
  },

  playButton: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },

  playText: {
    color: "#fff",
    fontWeight: "700",
  },

  deleteButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
  },

  disabledBtn: {
    opacity: 0.5,
    backgroundColor: "#9ca3af",
  },

  completeText: {
    color: "white",
    fontWeight: "600",
  },
});
