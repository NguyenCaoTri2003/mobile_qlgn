import React, { useState, useRef, useEffect } from "react";
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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system/legacy";
import AppNotification from "../components/AppNotification";
import { ActivityIndicator } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
// import { Audio } from "expo-av";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { stopTracking } from "../services/location-tracking.service";

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

  const submittingRef = useRef(false);

  const [cachedLocation, setCachedLocation] = useState<any>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  useEffect(() => {
    prefetchLocation();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkOrderStatus();
    }, []),
  );

  const checkOrderStatus = async () => {
    const order = await orderService.getOrderDetail(id);

    if (order.status === "COMPLETED") {
      navigation.reset({
        index: 0,
        routes: [{ name: "OrderList" as never }],
      });
    }
  };

  const prefetchLocation = async () => {
    try {
      setIsFetchingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      // Dùng Balanced để tiết kiệm pin và nhanh hơn
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
      });

      setCachedLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        timestamp: Date.now(),
      });

      console.log("✅ Đã cache vị trí");
    } catch (err) {
      console.log("⚠️ Không prefetch được vị trí:", err);
    } finally {
      setIsFetchingLocation(false);
    }
  };

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

  // const takePhoto = async () => {
  //   const res = await ImagePicker.launchCameraAsync({
  //     quality: 0.7,
  //   });

  //   if (!res.canceled) {
  //     const asset = res.assets[0];

  //     if (!(await validateImage(asset))) return;

  //     const compressed = await compressImage(asset.uri);

  //     // setImages((prev) => [...prev, asset]);
  //     setImages((prev) => [...prev, compressed]);
  //   }
  // };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Thông báo", "Bạn chưa cấp quyền camera");
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!res.canceled) {
      const asset = res.assets[0];

      if (!(await validateImage(asset))) return;

      const compressed = await compressImage(asset.uri);

      setImages((prev) => [...prev, compressed]);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Thông báo", "Bạn chưa cấp quyền thư viện ảnh");
      return;
    }

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

  // const getLocation = async () => {
  //   try {
  //     const { status } = await Location.requestForegroundPermissionsAsync();

  //     if (status !== "granted") {
  //       setNotify({
  //         visible: true,
  //         type: "error",
  //         message: "Không có quyền định vị",
  //       });
  //       return null;
  //     }

  //     const loc = await Location.getCurrentPositionAsync({
  //       accuracy: Location.Accuracy.High,
  //     });

  //     return {
  //       lat: loc.coords.latitude,
  //       lng: loc.coords.longitude,
  //     };
  //   } catch (err) {
  //     setNotify({
  //       visible: true,
  //       type: "error",
  //       message: "Không lấy được vị trí",
  //     });
  //     return null;
  //   }
  // };

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

  const getLocation = async () => {
    // Nếu có cache và còn mới (< 2 phút) thì dùng luôn
    if (cachedLocation && Date.now() - cachedLocation.timestamp < 120000) {
      console.log(
        "📍 Dùng vị trí cache (cách đây",
        Math.floor((Date.now() - cachedLocation.timestamp) / 1000),
        "giây)",
      );
      return {
        lat: cachedLocation.lat,
        lng: cachedLocation.lng,
      };
    }

    // Nếu cache cũ hoặc không có, lấy mới
    try {
      console.log("📍 Cache cũ, lấy vị trí mới...");

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setNotify({
          visible: true,
          type: "error",
          message: "Không có quyền định vị",
        });
        return null;
      }

      // Timeout sau 5 giây
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("GPS timeout")), 5000),
      );

      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
      });

      const location = (await Promise.race([
        locationPromise,
        timeoutPromise,
      ])) as any;

      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
    } catch (err) {
      console.log("⚠️ Lỗi GPS, dùng cache cũ:", err);

      // Fallback: dùng cache cũ nếu có
      if (cachedLocation) {
        return {
          lat: cachedLocation.lat,
          lng: cachedLocation.lng,
        };
      }

      setNotify({
        visible: true,
        type: "error",
        message: "Không lấy được vị trí, vui lòng thử lại",
      });
      return null;
    }
  };

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

  // const completeOrder = async () => {
  //   if (loading) return;

  //   if (submittingRef.current) return;

  //   submittingRef.current = true;

  //   if (images.length === 0) {
  //     setNotify({
  //       visible: true,
  //       type: "error",
  //       message: "Cần ít nhất 1 hình ảnh chứng từ",
  //     });
  //     return;
  //   }

  //   // if (orderType === "PICKUP" && !signaturePreview) {
  //   //   setNotify({
  //   //     visible: true,
  //   //     type: "error",
  //   //     message: "Cần chữ ký khách hàng",
  //   //   });
  //   //   return;
  //   // }

  //   try {
  //     setLoading(true);
  //     setLoadingText("Đang lấy vị trí GPS...");

  //     const location = await getLocation();

  //     if (!location) {
  //       setNotify({
  //         visible: true,
  //         type: "error",
  //         message: "Không lấy được vị trí GPS, vui lòng thử lại",
  //       });
  //       setLoading(false);
  //       return;
  //     }

  //     setLoadingText("Đang upload dữ liệu...");

  //     let signatureFile = undefined;

  //     if (signaturePreview) {
  //       const base64 = signaturePreview.replace("data:image/png;base64,", "");

  //       const fileUri = FileSystem.cacheDirectory + "signature.png";

  //       await FileSystem.writeAsStringAsync(fileUri, base64, {
  //         encoding: FileSystem.EncodingType.Base64,
  //       });

  //       signatureFile = {
  //         uri: fileUri,
  //         type: "image/png",
  //         fileName: "signature.png",
  //       };
  //     }

  //     await orderService.shipperComplete(
  //       id,
  //       images,
  //       location,
  //       signatureFile,
  //       audioUri
  //         ? {
  //             uri: audioUri,
  //             type: "audio/m4a",
  //             name: `audio-${Date.now()}.m4a`,
  //           }
  //         : null,
  //       note,
  //       attachments,
  //       missingNote,
  //     );

  //     // stopTracking();

  //     setTimeout(() => {
  //       setNotify({
  //         visible: true,
  //         type: "success",
  //         message: "Xác nhận hoàn tất đơn hàng thành công",
  //       });

  //       // navigation.reset({
  //       //   index: 0,
  //       //   routes: [{ name: "OrderList" as never }],
  //       // });
  //     }, 300);

  //     navigation.navigate("OrderList" as never);
  //   } catch (err: any) {
  //     setNotify({
  //       visible: true,
  //       type: "error",
  //       message: "Xác nhận hoàn tất đơn hàng thất bại",
  //     });
  //     // console.log("error completed: ", err);
  //     console.log("FULL ERROR:", {
  //       message: err?.message,
  //       code: err?.code,
  //       response: err?.response?.data,
  //       status: err?.response?.status,
  //       config: err?.config,
  //     });
  //   } finally {
  //     submittingRef.current = false;
  //     setLoading(false);
  //   }
  // };

  const completeOrder = async () => {
    if (loading || submittingRef.current) {
      return;
    }

    submittingRef.current = true;

    try {
      if (images.length === 0) {
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
        setNotify({
          visible: true,
          type: "error",
          message: "Không lấy được vị trí GPS, vui lòng thử lại",
        });
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

      const result = await orderService.shipperComplete(
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

      // navigation.navigate("OrderList" as never);
      navigation.reset({
        index: 0,
        routes: [{ name: "OrderList" as never }],
      });
    } catch (err: any) {
      // Log tất cả mọi thứ
      console.log("💥 CATCH ERROR 💥");
      console.log("Error type:", typeof err);
      console.log("Error keys:", Object.keys(err));
      console.log("Error:", err);
      console.log("Error message:", err?.message);
      console.log("Error code:", err?.code);
      console.log("Error response:", err?.response);
      console.log("Error response data:", err?.response?.data);
      console.log("Error response status:", err?.response?.status);
      console.log("Error request:", err?.request);
      console.log("Error config:", err?.config);
      console.log("Error stack:", err?.stack);

      // Log dạng JSON nếu có thể
      try {
        console.log("Error JSON:", JSON.stringify(err, null, 2));
      } catch (e) {
        console.log("Cannot stringify error");
      }

      setNotify({
        visible: true,
        type: "error",
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Xác nhận hoàn tất đơn hàng thất bại",
      });
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const handleSignature = async (sig: string) => {
    setSignaturePreview(sig);
    setShowSignModal(false);
  };

  const isValid = images.length > 0;
  // && (orderType === "DELIVERY" || !!signaturePreview);

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      contentContainerStyle={{ padding: 12 }}
      enableOnAndroid
      extraScrollHeight={100}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={scrollEnabled}
    >
      {/* Hình ảnh chứng từ */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="camera-outline" size={18} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Hình ảnh chứng từ *</Text>
        </View>

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

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={takePhoto}>
            <Ionicons name="camera" size={16} color="#3B82F6" />
            <Text style={styles.actionBtnText}>Chụp ảnh</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
            <Ionicons name="image-outline" size={16} color="#8B5CF6" />
            <Text style={[styles.actionBtnText, { color: "#8B5CF6" }]}>
              Chọn ảnh
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chữ ký khách hàng */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="pencil-outline" size={18} color="#F59E0B" />
          <Text style={styles.sectionTitle}>
            Chữ ký khách hàng
            {/* {orderType === "PICKUP" ? "*" : ""} */}
          </Text>
        </View>

        {signaturePreview ? (
          <View style={{ alignItems: "center" }}>
            <View style={styles.signaturePreviewBox}>
              <Image
                source={{ uri: signaturePreview }}
                style={styles.signaturePreviewImage}
              />
            </View>
            <TouchableOpacity
              onPress={() => setShowSignModal(true)}
              style={[styles.actionBtn, { marginTop: 8 }]}
            >
              <Ionicons name="refresh-outline" size={16} color="#F59E0B" />
              <Text style={[styles.actionBtnText, { color: "#F59E0B" }]}>
                Ký lại
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.signaturePlaceholder}
            onPress={() => setShowSignModal(true)}
          >
            <Ionicons name="create-outline" size={24} color="#94A3B8" />
            <Text style={styles.signaturePlaceholderText}>Thêm chữ ký</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Ghi chú */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text-outline" size={18} color="#10B981" />
          <Text style={styles.sectionTitle}>Ghi chú</Text>
        </View>

        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          placeholder="Nhập ghi chú nếu cần..."
          placeholderTextColor="#94A3B8"
          style={styles.noteInput}
        />
      </View>

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

      {/* Nút xác nhận */}
      <TouchableOpacity
        style={[
          styles.completeBtn,
          (!isValid || loading || isRecording) && styles.disabledBtn,
        ]}
        onPress={completeOrder}
        disabled={!isValid || loading || isRecording}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            !isValid || loading || isRecording
              ? ["#94A3B8", "#64748B"]
              : ["#10B981", "#059669"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.completeGradient}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.completeText}> {loadingText}</Text>
            </>
          ) : isRecording ? (
            <>
              <Ionicons name="radio" size={18} color="#FFFFFF" />
              <Text style={styles.completeText}> Đang ghi âm...</Text>
            </>
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.completeText}> Xác nhận hoàn tất</Text>
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

      {/* Modal chữ ký */}
      <Modal visible={showSignModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chữ ký khách hàng</Text>
              <TouchableOpacity onPress={() => setShowSignModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

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
                style={[styles.modalBtn, styles.modalBtnCancel]}
              >
                <Text style={styles.modalBtnTextCancel}>Đóng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={clearSignature}
                style={[styles.modalBtn, styles.modalBtnOutline]}
              >
                <Text style={styles.modalBtnTextOutline}>Xoá</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => signRef.current?.readSignature()}
                style={[styles.modalBtn, styles.modalBtnPrimary]}
              >
                <Text style={styles.modalBtnTextPrimary}>Đồng ý</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  imageWrapper: {
    position: "relative",
  },

  image: {
    width: 80,
    height: 80,
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
    color: "#3B82F6",
  },

  signaturePlaceholder: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    gap: 8,
  },

  signaturePlaceholderText: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "500",
  },

  signaturePreviewBox: {
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  signaturePreviewImage: {
    width: 180,
    height: 80,
    resizeMode: "contain",
  },

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

  completeBtn: {
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  completeGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 4,
  },

  disabledBtn: {
    opacity: 0.6,
    shadowColor: "#94A3B8",
  },

  completeText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 20,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },

  signatureBox: {
    height: 220,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FAFAFA",
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  modalBtnCancel: {
    backgroundColor: "#F1F5F9",
  },

  modalBtnOutline: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  modalBtnPrimary: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  modalBtnTextCancel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },

  modalBtnTextOutline: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
  },

  modalBtnTextPrimary: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Audio styles (giữ nguyên cho phần comment)
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

  deleteButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
