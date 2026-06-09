import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
  RefreshControl,
  Modal,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { orderService } from "../services/order.service";
import {
  getOrderTypeHighLabel,
  getOrderTypeLabel,
  getOrderTypeStyle,
  getOrderTypeTextStyle,
  getPaymentTypeLabel,
  getPaymentTypeStyle,
  getPaymentTypeTextStyle,
  statusColor,
  statusLabel,
  statusTextColor,
} from "../utils/statusOrder";
import { Image } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  getDeptColor,
  getDeptStyle,
  getDeptTextColor,
} from "../utils/departmentColor";
import NotFoundView from "../components/NotFoundView";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useOrderContext } from "../contexts/OrderContext";
import { TextInput } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OrdersStackParamList } from "../navigation/types";
import { usersService } from "../services/user.service";
import { Dropdown } from "react-native-element-dropdown";
import AppNotification from "../components/AppNotification";
import { useAuth } from "../contexts/AuthContext";
import {
  formatDate,
  getDeliveryStatus,
  getDeliveryStyle,
} from "../utils/dateUtils";

import * as Print from "expo-print";
import { buildOrderHTML } from "../templates/buildOrderHTML";
import ImagePreviewModal from "../components/ImagePreviewModal";
import { Buffer } from "buffer";
import { LinearGradient } from "expo-linear-gradient";
import {
  sendCurrentLocationOnce,
  startTracking,
} from "../services/location-tracking.service";
// import { Audio, AVPlaybackStatus } from "expo-av";

type NavigationType = NativeStackNavigationProp<
  OrdersStackParamList,
  "OrderDetail"
>;

export default function OrderDetailScreen({ route }: any) {
  const { id } = route.params;
  const { user } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [missingModal, setMissingModal] = useState(false);
  const [missingDocs, setMissingDocs] = useState<any[]>([]);

  const navigation = useNavigation<NavigationType>();

  const { reloadOrderCounts } = useOrderContext();
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [rejectReturnModal, setRejectReturnModal] = useState(false);
  const [rejectReturnReason, setRejectReturnReason] = useState("");

  const [selectedShipper, setSelectedShipper] = useState<number | null>(null);
  const [shippers, setShippers] = useState<any[]>([]);
  const [actionsHeight, setActionsHeight] = useState(0);

  const orderType = order?.orderType;
  const isPickup = orderType === "PICKUP";
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [progressMap, setProgressMap] = useState<Record<number, number>>({});
  const [currentTimeMap, setCurrentTimeMap] = useState<Record<number, string>>(
    {},
  );
  const [durationMap, setDurationMap] = useState<Record<number, string>>({});
  // const [sound, setSound] = useState<Audio.Sound | null>(null);

  const [acceptLoading, setAcceptLoading] = useState(false);

  const [finalizeModal, setFinalizeModal] = useState(false);
  const [finalizeReason, setFinalizeReason] = useState("");
  const [finalizeLoading, setFinalizeLoading] = useState(false);

  const [supplementModal, setSupplementModal] = useState(false);
  const [supplementNote, setSupplementNote] = useState("");
  const [supplementLoading, setSupplementLoading] = useState(false);

  const [ariseModal, setAriseModal] = useState(false);
  const [ariseReason, setAriseReason] = useState("");
  const [ariseLoading, setAriseLoading] = useState(false);

  const [editCustomerModal, setEditCustomerModal] = useState(false);
  const [newContact, setNewContact] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [updateCustomerLoading, setUpdateCustomerLoading] = useState(false);
  const [addressTouched, setAddressTouched] = useState(false);

  const [notify, setNotify] = useState({
    visible: false,
    type: "success" as "success" | "error",
    message: "",
  });

  const fetchDetail = async (showLoading: boolean = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const res = await orderService.getOrderDetail(id);
      setOrder(res);
      setAttachments(res.attachments || []);
    } catch (err) {
      console.log("Load detail error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) return;
      setLoading(true);

      try {
        const res = await orderService.getOrderDetail(id);
        if (isMounted) {
          setOrder(res);
          setAttachments(res.attachments || []);
        }
      } catch (err: any) {
        console.log("Load detail error:", err);
        if (isMounted) {
          // Reset dữ liệu khi có lỗi
          setOrder(null);
          setAttachments([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Lắng nghe focus event
    const unsubscribe = navigation.addListener("focus", () => {
      fetchData();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [id, navigation]);

  useEffect(() => {
    if (user?.role === "QL" || user?.role === "SUPERADMIN") {
      fetchShippers();
    }
  }, [user?.role]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", gap: 5 }}>
          {user.role !== "NVGN" && (
            <>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("OrderLogs", { orderId: order.id })
                }
                style={[
                  styles.exportBtn,
                  { backgroundColor: "#16a34a20", borderColor: "#16a34a" },
                ]}
              >
                <Ionicons name="time-outline" size={16} color="#16a34a" />
                <Text style={[styles.exportText, { color: "#16a34a" }]}>
                  Lịch sử
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleExportDocx}
                style={styles.exportBtn}
              >
                <Ionicons name="download-outline" size={16} color="#2563eb" />
                <Text style={styles.exportText}>Xuất đơn</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ),
    });
  }, [order, attachments]);

  const fetchShippers = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const res = await usersService.getShippersStats(today);

      setShippers(res);
    } catch (err) {
      console.log("Load shippers error detail:", err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await fetchDetail();
    } catch (err) {
      console.log("Refresh error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const parsePhoneNumbers = (phoneString: string) => {
    if (!phoneString) return [];

    // Tách theo dấu "/" hoặc "," hoặc ";"
    return phoneString
      .split(/[\/,;]/)
      .map((num) => num.trim())
      .filter((num) => num.length > 0);
  };

  // Hàm gọi điện
  const callNumber = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const call = () => {
    if (!order?.phone) return;
    Linking.openURL(`tel:${order.phone}`);
  };

  const openMap = () => {
    if (!order?.address) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      order.address,
    )}`;
    Linking.openURL(url);
  };

  const isChecklistActive = () => {
    const status = order?.status;
    const role = user?.role;
    const isOwner = order?.shipperId === user?.id;

    if (role === "NVGN") {
      if (orderType === "PICKUP") {
        return status === "PROCESSING";
      }

      return ["ASSIGNED", "PENDING", "SUPPLEMENT_REQUIRED"].includes(status);
    }

    if (role === "QL" || user?.role === "SUPERADMIN") {
      if (!isOwner) return false;

      if (orderType === "PICKUP") {
        return status === "PROCESSING";
      }

      return ["ASSIGNED"].includes(status);
    }

    return false;
  };

  const allChecked =
    attachments.length > 0 && attachments.every((a) => a.checked);

  const toggleChecklist = (index: number) => {
    const newList = attachments.map((a, i) =>
      i === index ? { ...a, checked: !a.checked } : a,
    );

    setAttachments(newList);
  };

  const toggleCheckAll = () => {
    if (!isChecklistActive()) return;

    if (allChecked) {
      setAttachments(attachments.map((a) => ({ ...a, checked: false })));
    } else {
      setAttachments(attachments.map((a) => ({ ...a, checked: true })));
    }
  };

  const timeoutRef = useRef<any>(null);

  const showNote = (id: number) => {
    if (activeNoteId === id) {
      setActiveNoteId(null);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    setActiveNoteId(id);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setActiveNoteId(null);
    }, 10000);
  };

  const downloadFile = async (url: string) => {
    try {
      const fileName = url.split("/").pop()?.split("?")[0] || "file";

      const fileUri = FileSystem.documentDirectory + fileName;

      const { uri } = await FileSystem.downloadAsync(url, fileUri);

      if (Platform.OS === "android") {
        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permissions.granted) return;

        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const newFileUri =
          await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            "application/octet-stream",
          );

        await FileSystem.writeAsStringAsync(newFileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        await Sharing.shareAsync(uri);
      }
    } catch (err) {
      console.log("Download error:", err);
    }
  };

  const getChecklistNote = () => {
    const type = order.orderType;

    if (type === "PICKUP") {
      return "Kiểm tra đầy đủ hồ sơ trước khi nhận từ khách hàng";
    }

    if (type === "DELIVERY") {
      return "Kiểm tra đầy đủ hồ sơ trước khi giao đến khách hàng";
    }

    if (type === "BOTH") {
      return "Kiểm tra đầy đủ hồ sơ trước khi giao và sau khi nhận thêm hồ sơ mới";
    }

    return "";
  };

  // const handleAcceptPress = () => {
  //   if (acceptLoading) return;

  //   setAcceptLoading(true);

  //   if (isPickup) {
  //     handleAcceptPick();
  //   } else {
  //     handleAccept();
  //   }
  // };

  const handleAcceptPress = async () => {
    if (acceptLoading) return;

    try {
      setAcceptLoading(true);

      if (isPickup) {
        await handleAcceptPick();
      } else {
        await handleAccept();
      }
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleAccept = async () => {
    const missing = attachments.filter((a) => !a.checked);

    if (missing.length > 0) {
      setMissingDocs(missing);
      setMissingModal(true);
      setAcceptLoading(false);
      return;
    }

    try {
      await orderService.shipperAccept(id, attachments, "");

      // await sendCurrentLocationOnce(id);

      // await startTracking(id);

      setNotify({
        visible: true,
        type: "success",
        message: "Đã xác nhận đơn thành công",
      });

      await fetchDetail();
    } catch (err) {
      setNotify({
        visible: true,
        type: "error",
        message: "Xác nhận đơn thất bại",
      });

      console.log(err);
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleAcceptPick = async () => {
    try {
      await orderService.shipperAcceptPick(id);

      // await startTracking(id);

      setNotify({
        visible: true,
        type: "success",
        message: "Đã xác nhận đơn thành công",
      });

      await fetchDetail();
    } catch (err) {
      setNotify({
        visible: true,
        type: "error",
        message: "Xác nhận đơn thất bại",
      });

      console.log(err);
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleComplete = () => {
    if (orderType === "PICKUP") {
      const missing = attachments.filter((a) => !a.checked);
      if (missing.length > 0) {
        setMissingDocs(missing);
        setMissingModal(true);
        return;
      }
    }
    navigation.navigate("CompleteOrder", { id, orderType });
  };

  const acceptWithMissing = async () => {
    const missingNote = missingDocs
      .map((d) => `${d.name} (${d.qty})`)
      .join(", ");

    if (orderType !== "PICKUP") {
      try {
        await orderService.shipperAccept(id, attachments, missingNote);

        setMissingModal(false);

        setNotify({
          visible: true,
          type: "success",
          message: "Đã nhận đơn (có ghi chú thiếu hồ sơ)",
        });

        setTimeout(async () => {
          await reloadOrderCounts();
          navigation.navigate("OrderList" as never);
        }, 1600);
      } catch (err) {
        setNotify({
          visible: true,
          type: "error",
          message: "Nhận đơn thất bại",
        });

        console.log(err);
      }
    } else {
      navigation.navigate("CompleteOrder", {
        id,
        attachments,
        missingNote,
        orderType,
      });
    }
  };

  const requestSupplement = async () => {
    try {
      const note =
        "Thiếu hồ sơ: " +
        missingDocs.map((d) => `${d.name} (${d.qty})`).join(", ");

      await orderService.shipperReturnSupplement(id, note, order.orderCode);

      setMissingModal(false);

      setNotify({
        visible: true,
        type: "success",
        message: "Đã yêu cầu bổ sung hồ sơ",
      });

      setTimeout(async () => {
        await reloadOrderCounts();
        navigation.navigate("OrderList" as never);
      }, 1600);
    } catch (err) {
      setNotify({
        visible: true,
        type: "error",
        message: "Yêu cầu bổ sung thất bại",
      });

      console.log(err);
    }
  };

  const handleResolveSupplement = async () => {
    if (!supplementNote.trim()) {
      setNotify({
        visible: true,
        type: "error",
        message: "Vui lòng nhập thông tin đã bổ sung",
      });
      return;
    }

    setSupplementLoading(true);

    try {
      await orderService.resolveRequest(order.id, supplementNote);

      setNotify({
        visible: true,
        type: "success",
        message: "Đã xác nhận bổ sung hồ sơ thành công",
      });

      setSupplementModal(false);
      setSupplementNote("");

      setTimeout(async () => {
        await reloadOrderCounts();
        navigation.navigate("OrderList" as never);
      }, 1600);
    } catch (err: any) {
      setNotify({
        visible: true,
        type: "error",
        message: err?.response?.data?.message || "Có lỗi xảy ra",
      });
    } finally {
      setSupplementLoading(false);
    }
  };

  const handleAdminFinalize = async (approved: boolean) => {
    if (!approved && !finalizeReason.trim()) {
      setNotify({
        visible: true,
        type: "error",
        message: "Vui lòng nhập lý do không duyệt",
      });
      return;
    }

    setFinalizeLoading(true);

    try {
      await orderService.adminFinalize(
        order.id,
        approved,
        approved ? undefined : finalizeReason,
      );

      setNotify({
        visible: true,
        type: "success",
        message: approved ? "Duyệt đơn thành công" : "Đã từ chối duyệt đơn",
      });

      setFinalizeModal(false);
      setFinalizeReason("");

      setTimeout(async () => {
        await reloadOrderCounts();
        navigation.navigate("OrderList" as never);
      }, 1600);
    } catch (err: any) {
      setNotify({
        visible: true,
        type: "error",
        message: err?.response?.data?.message || "Có lỗi xảy ra",
      });
    } finally {
      setFinalizeLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate("OrderForm", { orderData: order });
  };

  const handleDelete = async (orderId: number) => {
    Alert.alert(
      "Xác nhận xoá đơn",
      "Bạn có chắc chắn muốn xoá đơn này không?",
      [
        {
          text: "Huỷ",
          style: "cancel",
        },
        {
          text: "Xoá",
          style: "destructive",
          onPress: async () => {
            try {
              await orderService.deleteOrder(orderId);

              setNotify({
                visible: true,
                type: "success",
                message: "Đã xoá đơn thành công",
              });

              setTimeout(async () => {
                await reloadOrderCounts();
                navigation.navigate("OrderList" as never);
              }, 1600);
            } catch (err) {
              setNotify({
                visible: true,
                type: "error",
                message: "Xoá đơn thất bại",
              });

              console.log(err);
            }
          },
        },
      ],
    );
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      await orderService.shipperReject(id, rejectReason, order.orderCode);

      setRejectModal(false);
      setRejectReason("");

      setNotify({
        visible: true,
        type: "success",
        message: "Đã từ chối đơn thành công",
      });

      setTimeout(async () => {
        await reloadOrderCounts();
        navigation.navigate("OrderList" as never);
      }, 1600);
    } catch (err) {
      setNotify({
        visible: true,
        type: "error",
        message: "Từ chối đơn thất bại",
      });

      console.log(err);
    }
  };

  const setHighlight = async (color: "red" | "blue" | "yellow" | null) => {
    try {
      await orderService.setShipperHighlightColor(order.id, color);

      setOrder({
        ...order,
        shipperHighlightColor: color,
      });
    } catch (err) {
      console.log("Highlight error:", err);
    }
  };

  const handleAssign = async () => {
    try {
      const shipper = shippers.find((s) => s.id === selectedShipper);

      const attachmentIds = attachments
        .filter((a) => a.checked)
        .map((a) => a.id);

      await orderService.assignReceiver(
        order.id,
        order.orderCode,
        shipper.id,
        shipper.email,
        shipper.name,
        attachmentIds,
      );

      setNotify({
        visible: true,
        type: "success",
        message: "Phân công thành công",
      });

      setTimeout(async () => {
        await reloadOrderCounts();
        navigation.navigate("OrderList" as never);
      }, 1600);
    } catch (err) {
      setNotify({
        visible: true,
        type: "error",
        message: "Phân công thất bại",
      });

      console.log("Assign error:", err);
    }
  };

  const managerApproveReturnHandler = async (approved: boolean) => {
    try {
      if (!order?.id || !order?.deliveryAttempt?.attemptId) {
        setNotify({
          visible: true,
          type: "error",
          message: "Không tìm thấy thông tin đơn hoặc attempt",
        });
        return;
      }

      await orderService.managerApproveReturn(
        order.id,
        order.deliveryAttempt?.attemptId,
        approved,
        approved ? undefined : rejectReturnReason,
      );

      setNotify({
        visible: true,
        type: "success",
        message: approved
          ? "Đã duyệt hoàn đơn thành công"
          : "Đã từ chối hoàn đơn thành công",
      });

      if (!approved) {
        setRejectReturnModal(false);
        setRejectReturnReason("");
      }

      setTimeout(async () => {
        await reloadOrderCounts();
        navigation.navigate("OrderList" as never);
      }, 1600);
    } catch (err: any) {
      console.error(err);
      setNotify({
        visible: true,
        type: "error",
        message: `Lỗi: $${err?.response?.data?.message}` || "Có lỗi xảy ra",
      });
    }
  };

  const deptStyle = getDeptStyle(order?.department?.code);

  const bufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;

    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
  };

  const handleExportPDF = async () => {
    try {
      const html = buildOrderHTML(order, attachments);

      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");

      const fileName = `${order.orderCode || order.id}_${now.getFullYear()}${pad(
        now.getMonth() + 1,
      )}${pad(now.getDate())}${pad(now.getHours())}${pad(
        now.getMinutes(),
      )}${pad(now.getSeconds())}.pdf`;

      const { uri } = await Print.printToFileAsync({
        html,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) return;

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: fileName,
      });
    } catch (err) {
      console.log("PDF error:", err);
    }
  };

  const handleExportDocx = async () => {
    try {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");

      const fileName = `${order.orderCode || order.id}_${now.getFullYear()}${pad(
        now.getMonth() + 1,
      )}${pad(now.getDate())}${pad(now.getHours())}${pad(
        now.getMinutes(),
      )}${pad(now.getSeconds())}.docx`;

      const fileData = await orderService.exportDocx(order, attachments);

      const base64 = Buffer.from(fileData, "binary").toString("base64");

      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) return;

      await Sharing.shareAsync(fileUri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        dialogTitle: fileName,
      });
    } catch (err) {
      console.log("DOCX error:", err);
    }
  };

  const formatTime = (sec: any) => {
    if (!sec) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // const toggleAudio = async (url: string, index: number) => {
  //   try {
  //     // pause nếu đang phát cùng file
  //     if (currentAudio === url && isPlaying && sound) {
  //       await sound.pauseAsync();
  //       setIsPlaying(false);
  //       return;
  //     }

  //     let newSound: Audio.Sound | null = sound;

  //     // nếu đổi file khác
  //     if (currentAudio !== url) {
  //       if (sound) {
  //         await sound.unloadAsync();
  //       }

  //       const { sound: createdSound } = await Audio.Sound.createAsync(
  //         { uri: url },
  //         { shouldPlay: true },
  //         onPlaybackStatusUpdate(index),
  //       );

  //       newSound = createdSound;
  //       setSound(createdSound);
  //       setCurrentAudio(url);
  //     } else if (newSound) {
  //       await newSound.playAsync();
  //     }

  //     setIsPlaying(true);
  //   } catch (err) {
  //     console.log("Audio error:", err);
  //   }
  // };

  // const onPlaybackStatusUpdate =
  //   (index: number) => (status: AVPlaybackStatus) => {
  //     if (!status.isLoaded) return;

  //     const current = (status.positionMillis ?? 0) / 1000;
  //     const duration = (status.durationMillis ?? 0) / 1000;

  //     setCurrentTimeMap((prev) => ({
  //       ...prev,
  //       [index]: formatTime(current),
  //     }));

  //     setDurationMap((prev) => ({
  //       ...prev,
  //       [index]: formatTime(duration),
  //     }));

  //     setProgressMap((prev) => ({
  //       ...prev,
  //       [index]: duration ? (current / duration) * 100 : 0,
  //     }));

  //     if (status.didJustFinish) {
  //       setIsPlaying(false);

  //       setProgressMap((prev) => ({
  //         ...prev,
  //         [index]: 0,
  //       }));
  //     }
  //   };

  const archiveReturnedHandler = async () => {
    try {
      await orderService.qlArchivedOrder(order.id, order.orderCode);
      setNotify({
        visible: true,
        type: "success",
        message: "Đã lưu trữ đơn thành công",
      });
      setTimeout(async () => {
        await reloadOrderCounts();
        navigation.navigate("OrderList" as never);
      }, 1000);
    } catch (err) {
      setNotify({
        visible: true,
        type: "error",
        message: "Lưu trữ đơn thất bại",
      });
      console.log("Archive error:", err);
    }
  };

  if (loading && !order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!order && !loading) {
    return (
      <NotFoundView
        title="Không tìm thấy đơn hàng"
        subtitle="Đơn có thể đã bị xoá hoặc bạn không có quyền xem."
        onBack={() => navigation.goBack()}
      />
    );
  }

  const isQLAssign =
    (user?.role === "QL" || user?.role === "SUPERADMIN") &&
    order?.status === "PENDING";

  const isQLReturned =
    (user?.role === "QL" || user?.role === "SUPERADMIN") &&
    (order?.status === "RETURNED_CUSTOMER" ||
      order?.status === "RETURNED_PERSONAL" ||
      order?.status === "REJECTED" ||
      order?.status === "SUPPLEMENT_REQUIRED");

  // const isNVGNAssigned = user?.role === "NVGN" && order?.status === "ASSIGNED";
  const isNVGNAssigned =
    order?.status === "ASSIGNED" &&
    (user?.role === "NVGN" ||
      (user?.role === "QL" && order?.shipperId === user?.id));

  const isNVGNProcessing =
    order?.status === "PROCESSING" &&
    (user?.role === "NVGN" ||
      (user?.role === "QL" && order?.shipperId === user?.id));

  // const canReassign =
  //   order?.status === "RETURNED_PERSONAL" ||
  //   (order?.status === "RETURNED_CUSTOMER" &&
  //     (!order?.deliveryAttempt?.approvalStatus ||
  //       ["APPROVED", "REJECTED"].includes(
  //         order?.deliveryAttempt?.approvalStatus,
  //       )));

  // const canApprove =
  //   order?.status === "RETURNED_CUSTOMER" &&
  //   order?.deliveryAttempt?.approvalStatus === "PENDING";

  const approval = order?.deliveryAttempt?.approvalStatus;

  const canReassign =
    ["REJECTED", "SUPPLEMENT_REQUIRED"].includes(order?.status) ||
    (["RETURNED_CUSTOMER", "RETURNED_PERSONAL"].includes(order?.status) &&
      (!approval || ["APPROVED", "REJECTED"].includes(approval)));

  const canApprove =
    ["RETURNED_CUSTOMER", "RETURNED_PERSONAL"].includes(order?.status) &&
    approval === "PENDING";

  const isAdmin = user?.role === "NVADMIN" || user?.role === "SUPERADMIN";
  const canAdminApprove = isAdmin && ["COMPLETED"].includes(order?.status);
  const canPending = isAdmin && order?.status === "PENDING";
  const canSupplement = isAdmin && order?.status === "SUPPLEMENT_REQUIRED";

  // Check điều kiện hiển thị nút phát sinh cho NVGN
  const isNVGNArise =
    (order?.status === "ASSIGNED" || order?.status === "PROCESSING") &&
    (user?.role === "NVGN" ||
      (user?.role === "QL" && order?.shipperId === user?.id));

  // Check điều kiện hiển thị nút thay đổi thông tin cho admin
  const isAdminArise =
    (user?.role === "NVADMIN" || user?.role === "SUPERADMIN") &&
    order?.status === "ARISING";

  const isNVGNAriseReject =
    order?.status === "ARISING" &&
    (user?.role === "NVGN" ||
      (user?.role === "QL" && order?.shipperId === user?.id));

  const hasActions =
    isQLAssign ||
    isQLReturned ||
    isNVGNAssigned ||
    isNVGNProcessing ||
    canReassign ||
    canApprove ||
    canAdminApprove ||
    canPending ||
    canSupplement ||
    isAdminArise ||
    isNVGNAriseReject;

  const handleArise = async () => {
    if (ariseLoading) return;

    setAriseLoading(true);

    try {
      await orderService.shipperArising(order.id, ariseReason, order.orderCode);

      setAriseModal(false);
      setAriseReason("");

      setNotify({
        visible: true,
        type: "success",
        message: "Đã gửi yêu cầu phát sinh đến admin",
      });

      setTimeout(async () => {
        await reloadOrderCounts();
        await fetchDetail();
      }, 500);
    } catch (err: any) {
      setNotify({
        visible: true,
        type: "error",
        message:
          err?.response?.data?.message || "Gửi yêu cầu phát sinh thất bại",
      });
    } finally {
      setAriseLoading(false);
    }
  };

  // Mở modal thay đổi thông tin khách hàng
  const openEditCustomer = () => {
    setNewContact(order.contactNew || order.contact || "");
    setNewPhone(order.phoneNew || order.phone || "");
    setNewAddress(order.addressNew || order.address || "");
    setAddressTouched(false);
    setEditCustomerModal(true);
  };

  const canSaveCustomerInfo = () => {
    // Địa chỉ không được để trống
    if (!newAddress || !newAddress.trim()) {
      return false;
    }

    // Phải có ít nhất 1 thay đổi
    const contactChanged = newContact !== (order.contact || "");
    const phoneChanged = newPhone !== (order.phone || "");
    const addressChanged = newAddress !== (order.address || "");

    return contactChanged || phoneChanged || addressChanged;
  };

  // Lưu thông tin khách hàng mới
  const saveCustomerInfo = async () => {
    if (!canSaveCustomerInfo() || updateCustomerLoading) return;

    setUpdateCustomerLoading(true);

    try {
      await orderService.updateArising(
        order.id,
        newContact || "",
        newPhone || "",
        newAddress || "",
      );

      setNotify({
        visible: true,
        type: "success",
        message: "Đã cập nhật thông tin khách hàng mới",
      });

      setEditCustomerModal(false);
      setNewContact("");
      setNewPhone("");
      setNewAddress("");
      setAddressTouched(false);

      setTimeout(async () => {
        await reloadOrderCounts();
        await fetchDetail();
      }, 500);
    } catch (err: any) {
      setNotify({
        visible: true,
        type: "error",
        message: err?.response?.data?.message || "Cập nhật thất bại",
      });
    } finally {
      setUpdateCustomerLoading(false);
    }
  };

  const deliveryStatus = getDeliveryStatus(
    order.date,
    order.time,
    order.status,
  );

  // const shipperOptions = shippers.map((s) => ({
  //   label:
  //     s.stats?.active_orders > 0
  //       ? `${s.name} 🔴 ${s.stats.active_orders} đơn`
  //       : `${s.name} 🟢 Rảnh`,
  //   value: s.id,
  // }));

  const shipperOptions = shippers.map((s) => ({
    name: s.name,
    activeOrders: s.stats?.active_orders || 0,
    value: s.id,
  }));

  const deliveryStyle = getDeliveryStyle(order.date, order.time, order.status);

  const rejectReasons = [
    "Khách hàng không nghe máy",
    "Khách hàng đổi địa chỉ",
    "Khách hàng hẹn lại ngày khác",
    "Lỗi hệ thống không hiện đơn",
    "Yêu cầu phát sinh không được phản hồi",
    "Không liên lạc được với khách hàng",
  ];

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 8 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.codeRow}>
            <Text style={styles.orderCode}>#{order.orderCode || order.id}</Text>

            {order.priority === "HIGH" && (
              <View style={styles.priorityInlineBadge}>
                <Text style={styles.priorityInlineText}>
                  🔥 {getOrderTypeHighLabel(order?.orderType)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.headerRow}>
            {/* Department */}
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Bộ phận</Text>
              {order?.department?.name && (
                <View
                  style={[
                    styles.deptBadge,
                    {
                      backgroundColor: deptStyle.backgroundColor,
                      borderColor: deptStyle.borderColor,
                    },
                  ]}
                >
                  <Text
                    style={[styles.deptText, { color: deptStyle.textColor }]}
                  >
                    {order?.department?.name}
                  </Text>
                </View>
              )}
            </View>

            {/* Status */}
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Trạng thái</Text>
              <View
                style={[styles.statusBadge, statusColor(order?.status || "")]}
              >
                <Text
                  style={[styles.statusText, statusTextColor(order?.status)]}
                >
                  {statusLabel(order?.status)}
                </Text>
              </View>
            </View>

            {/* Order Type */}
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Loại yêu cầu</Text>
              <View
                style={[
                  styles.orderTypeBadge,
                  getOrderTypeStyle(order?.orderType),
                ]}
              >
                <Text
                  style={[
                    styles.orderTypeText,
                    getOrderTypeTextStyle(order?.orderType),
                  ]}
                >
                  {getOrderTypeLabel(order?.orderType)}
                </Text>
              </View>
            </View>
          </View>

          {user?.role === "NVGN" && (
            <View style={styles.colorPicker}>
              <TouchableOpacity
                style={[
                  styles.colorDot,
                  { backgroundColor: "#ef4444" },
                  order.shipperHighlightColor === "red" && styles.colorSelected,
                ]}
                onPress={() => setHighlight("red")}
              />

              <TouchableOpacity
                style={[
                  styles.colorDot,
                  { backgroundColor: "#3b82f6" },
                  order.shipperHighlightColor === "blue" &&
                    styles.colorSelected,
                ]}
                onPress={() => setHighlight("blue")}
              />

              <TouchableOpacity
                style={[
                  styles.colorDot,
                  { backgroundColor: "#facc15" },
                  order.shipperHighlightColor === "yellow" &&
                    styles.colorSelected,
                ]}
                onPress={() => setHighlight("yellow")}
              />

              <TouchableOpacity onPress={() => setHighlight(null)}>
                <Text style={styles.clearColor}>XÓA</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {order.senderName && (
          <View style={styles.creatorBox}>
            <View style={styles.creatorHeader}>
              <Ionicons
                name="person-circle-outline"
                size={14}
                color="#2563eb"
              />
              <Text style={styles.creatorLabel}>Người yêu cầu</Text>
            </View>

            <Text style={styles.creatorName}>{order.senderName}</Text>
            <View style={styles.creatorContactRow}>
              <Text style={styles.creatorEmail}>{order.senderEmail || ""}</Text>

              {order.senderPhone && (
                <View style={styles.phoneList}>
                  {parsePhoneNumbers(order.senderPhone).map((phone, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => callNumber(phone)}
                      style={styles.phoneItem}
                    >
                      <Ionicons name="call-outline" size={10} color="#2563eb" />
                      <Text style={styles.creatorPhone}>{phone}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {order.missingDocs && (
          <View style={styles.alertRed}>
            <Text style={styles.alertRedText}>
              <Text
                style={{ fontWeight: "700", fontSize: 11, color: "#a31616" }}
              >
                Thiếu hồ sơ:{" "}
              </Text>
              {order.missingDocs}
            </Text>
          </View>
        )}

        {order.status === "REJECTED" && order.rejectionReason && (
          <View style={styles.alertRed}>
            <Text style={styles.alertRedText}>
              <Text
                style={{ fontWeight: "700", fontSize: 11, color: "#a31616" }}
              >
                Lý do từ chối:{" "}
              </Text>
              {order.rejectionReason}
            </Text>
          </View>
        )}

        {order.status === "SUPPLEMENT_REQUIRED" && order.supplementNote && (
          <View style={styles.alertYellow}>
            <Text style={styles.alertYellowText}>
              <Text
                style={{ fontWeight: "700", fontSize: 11, color: "#645e0d" }}
              >
                Yêu cầu bổ sung:{" "}
              </Text>
              {order.supplementNote}
            </Text>
          </View>
        )}

        {order.status === "ARISING" && order.arisingReason && (
          <View style={styles.alertYellow}>
            <Text style={styles.alertYellowText}>
              <Text
                style={{ fontWeight: "700", fontSize: 11, color: "#645e0d" }}
              >
                Yêu cầu phát sinh:{" "}
              </Text>
              {order.arisingReason}
            </Text>
          </View>
        )}

        {order.adminResponse && (
          <View style={styles.alertRed}>
            {/* <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            > */}
            <Text style={{ fontWeight: "700", fontSize: 11, color: "#a31616" }}>
              Lý do từ chối:{" "}
            </Text>
            <Text style={styles.alertRedText}>{order.adminResponse}</Text>
            {/* </View> */}
          </View>
        )}

        {/* New Customer Info Card (if exists) */}
        {(order.contactNew || order.phoneNew || order.addressNew) && (
          <View style={styles.newCustomerCard}>
            {/* Badge Mới */}
            <View style={styles.newCustomerBadge}>
              <Ionicons name="swap-horizontal" size={12} color="#fff" />
              <Text style={styles.newCustomerBadgeText}>Thông tin mới</Text>
            </View>

            <View style={{ marginTop: 8 }}>
              <Text style={styles.company}>{order.company}</Text>

              <TouchableOpacity
                style={styles.row}
                onPress={() => callNumber(order.phoneNew)}
              >
                <Ionicons name="call-outline" size={14} color="#2563eb" />
                <Text style={styles.link}>
                  {order.phoneNew || "Không có số điện thoại"}
                </Text>
              </TouchableOpacity>

              {order.addressNew ? (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => {
                    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.addressNew)}`;
                    Linking.openURL(url);
                  }}
                >
                  <Ionicons name="location-outline" size={14} color="#2563eb" />
                  <Text style={styles.link}>{order.addressNew}</Text>
                </TouchableOpacity>
              ) : null}

              <View style={styles.row}>
                <Ionicons name="person-outline" size={14} color="#6b7280" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.value}>
                    {order.contactNew || "Không có tên người liên hệ"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Divider giữa mới và cũ */}
        {(order.contactNew || order.phoneNew || order.addressNew) && (
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerLabelContainer}>
              <Text style={styles.dividerLabel}>Thông tin cũ</Text>
            </View>
          </View>
        )}

        {/* Main Info (Cũ hoặc mặc định) */}
        <View
          style={[
            styles.card,
            (order.contactNew || order.phoneNew || order.addressNew) &&
              styles.oldCustomerCard,
          ]}
        >
          <Text style={styles.cardTitle}>
            {order.contactNew || order.phoneNew || order.addressNew
              ? "Khách hàng (Cũ)"
              : "Khách hàng"}
          </Text>

          <Text
            style={[
              styles.company,
              (order.contactNew || order.phoneNew || order.addressNew) &&
                styles.oldText,
            ]}
          >
            {order.company}
          </Text>

          {order.phone ? (
            <TouchableOpacity style={styles.row} onPress={call}>
              <Ionicons
                name="call-outline"
                size={14}
                color={
                  order.contactNew || order.phoneNew || order.addressNew
                    ? "#9ca3af"
                    : "#2563eb"
                }
              />
              <Text
                style={[
                  styles.link,
                  (order.contactNew || order.phoneNew || order.addressNew) &&
                    styles.oldLink,
                ]}
              >
                {order.phone || "Không có số điện thoại"}
              </Text>
            </TouchableOpacity>
          ) : null}

          {order.address ? (
            order.contactNew || order.phoneNew || order.addressNew ? (
              <View style={styles.row}>
                <Ionicons name="location-outline" size={14} color="#9ca3af" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.value, styles.oldText]}>
                    {order.address}
                  </Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.row} onPress={openMap}>
                <Ionicons name="location-outline" size={14} color="#2563eb" />
                <Text style={styles.link}>{order.address}</Text>
              </TouchableOpacity>
            )
          ) : null}

          {order.contact ? (
            <View style={styles.row}>
              <Ionicons
                name="person-outline"
                size={14}
                color={
                  order.contactNew || order.phoneNew || order.addressNew
                    ? "#9ca3af"
                    : "#6b7280"
                }
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.value,
                    (order.contactNew || order.phoneNew || order.addressNew) &&
                      styles.oldText,
                  ]}
                >
                  {order.contact || "Không có người liên hệ"}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* DELIVERY INFO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin giao nhận</Text>

          <View
            style={[
              styles.deliveryBox,
              {
                backgroundColor: order.timeSlot ? "#EFF6FF" : deliveryStyle.bg,
                borderColor: order.timeSlot ? "#BFDBFE" : deliveryStyle.bg,
              },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={12}
              color={order.timeSlot ? "#3B82F6" : deliveryStyle.icon}
            />

            <Text
              style={[
                styles.deliveryText,
                {
                  color: order.timeSlot ? "#1D4ED8" : deliveryStyle.text,
                },
              ]}
            >
              {order.timeSlot
                ? order.timeSlot === "MORNING"
                  ? "Buổi sáng"
                  : "Buổi chiều"
                : order.time || "Chưa có giờ"}{" "}
              •
              {order.date === new Date().toISOString().split("T")[0]
                ? " Hôm nay"
                : formatDate(order.date)}
              {!order.timeSlot && deliveryStatus && (
                <Text style={{ color: deliveryStyle.text }}>
                  {" "}
                  • {deliveryStatus}
                </Text>
              )}
            </Text>
          </View>

          <View style={styles.purposeContainer}>
            <Text style={styles.purposeHeader}>Thông tin yêu cầu</Text>

            <Text style={styles.purposeText}>{order.purpose}</Text>
          </View>

          {(order.paymentType ||
            order.amountVND > 0 ||
            order.amountUSD > 0) && (
            <View style={styles.paymentContainer}>
              {/* Header */}
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentHeaderText}>
                  Thông tin thanh toán
                </Text>
              </View>

              {/* Payment Type Text */}
              {order.paymentType && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentIcon}>
                    {order.paymentType === "COLLECT" ? "💰" : "💸"}
                  </Text>

                  <Text style={styles.paymentTextLine}>
                    Đơn này yêu cầu{" "}
                    <Text
                      style={[
                        styles.paymentHighlight,
                        order.paymentType === "COLLECT"
                          ? styles.collectText
                          : styles.payText,
                      ]}
                    >
                      {order.paymentType === "COLLECT"
                        ? "THU TIỀN"
                        : "THANH TOÁN"}
                    </Text>{" "}
                    {order.paymentType === "COLLECT"
                      ? "từ khách hàng"
                      : "cho khách hàng"}
                  </Text>
                </View>
              )}

              {/* Amounts */}
              {(order.amountVND > 0 || order.amountUSD > 0) && (
                <View style={styles.amountRow}>
                  {/* VND */}
                  {order.amountVND > 0 && (
                    <View style={styles.amountItem}>
                      <Text style={styles.amountLabel}>Tiền VNĐ</Text>
                      <Text style={styles.amountValue}>
                        {order.amountVND.toLocaleString()} ₫
                      </Text>
                    </View>
                  )}

                  {/* USD */}
                  {order.amountUSD > 0 && (
                    <View
                      style={[styles.amountItem, { alignItems: "flex-end" }]}
                    >
                      <Text style={styles.amountLabel}>Tiền USD</Text>
                      <Text style={styles.amountValue}>
                        {order.amountUSD.toLocaleString()} $
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {order.receiverName && (
          <View style={styles.assignedBox}>
            <View style={styles.assignedHeader}>
              <Ionicons
                name="person-circle-outline"
                size={14}
                color="#2563eb"
              />
              <Text style={styles.assignedLabel}>Nhân viên giao nhận</Text>
            </View>

            {/* tên */}
            <Text style={styles.assignedName}>{order.receiverName}</Text>

            {/* email */}
            {order.receiver && (
              <Text style={styles.assignedEmail}>{order.receiver}</Text>
            )}
          </View>
        )}

        {/* CHECKLIST */}
        {attachments.length > 0 && (
          <View style={styles.card}>
            {/* HEADER */}
            <View style={styles.checkHeader}>
              <View style={styles.titleBox}>
                <Text style={styles.cardTitle}>Checklist hồ sơ</Text>

                {!!getChecklistNote() && (
                  <Text style={styles.subtitle}>{getChecklistNote()}</Text>
                )}
              </View>

              {isChecklistActive() && (
                <TouchableOpacity onPress={toggleCheckAll}>
                  <Text style={styles.checkAllBtn}>
                    {allChecked ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* LIST */}
            {attachments.map((a, i) => (
              <View key={a.id} style={styles.itemBox}>
                <TouchableOpacity
                  style={styles.checkItem}
                  onPress={() => toggleChecklist(i)}
                  disabled={!isChecklistActive()}
                >
                  <Ionicons
                    name={a.checked ? "checkbox" : "square-outline"}
                    size={18}
                    color={
                      !isChecklistActive()
                        ? "#d1d5db"
                        : a.checked
                          ? "#16a34a"
                          : "#6b7280"
                    }
                  />

                  <View style={styles.checkContent}>
                    {/* NAME + QTY */}
                    <View style={styles.rowBetween}>
                      <Text style={styles.checkText}>{a.name}</Text>
                      <Text style={styles.qtyText}>x{a.qty}</Text>
                    </View>

                    {/* TYPE */}
                    <View style={styles.typeRow}>
                      {a.is_original && (
                        <Text style={[styles.typeTag, { color: "#16a34a" }]}>
                          Bản gốc
                        </Text>
                      )}
                      {a.is_original_hph && (
                        <Text style={[styles.typeTag, { color: "#2563eb" }]}>
                          Bản gốc HPH
                        </Text>
                      )}
                      {a.is_copy && (
                        <Text style={[styles.typeTag, { color: "#6b7280" }]}>
                          Bản sao
                        </Text>
                      )}
                    </View>

                    {/* DETAIL */}
                    {!!a.detail && (
                      <Text style={styles.detailText}>{a.detail}</Text>
                    )}

                    {/* NOTE */}
                    {!!a.note && (
                      <>
                        <TouchableOpacity
                          onPress={() => showNote(a.id)}
                          style={styles.noteBtn}
                        >
                          <Ionicons
                            name={
                              activeNoteId === a.id
                                ? "information-circle"
                                : "information-circle-outline"
                            }
                            size={12}
                            color={"#f97316"}
                          />

                          <Text
                            style={[
                              styles.noteIcon,
                              activeNoteId === a.id && { color: "#f97316" },
                            ]}
                          >
                            Ghi chú
                          </Text>
                        </TouchableOpacity>

                        {activeNoteId === a.id && (
                          <Text style={styles.noteTextAtt}>{a.note}</Text>
                        )}
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {order?.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ghi chú thêm</Text>

            <View style={styles.noteBox}>
              <Text style={styles.noteText}>{order.notes}</Text>
            </View>
          </View>
        )}

        {(order.status === "COMPLETED" || order.status === "FINISHED") && (
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
              <Text style={styles.cardTitleSuccess}>Thông tin hoàn tất</Text>
            </View>
            {order.status === "COMPLETED" && (
              <Text style={styles.successText}>
                Đơn hàng đã được giao thành công. Vui lòng chờ nhân viên phòng
                ban duyệt để hoàn tất đơn hàng.
              </Text>
            )}

            {order.completedAt && (
              <Text style={styles.timeText}>
                ⏱ Hoàn tất lúc:{" "}
                <Text style={styles.timeSuccess}>
                  {new Date(order.completedAt).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </Text>
              </Text>
            )}

            {/* Images */}
            <View style={styles.imageGrid}>
              {order.completionImages.map((img: string, i: number) => (
                <TouchableOpacity key={i} onPress={() => setPreviewImage(img)}>
                  <Image source={{ uri: img }} style={styles.image} />
                </TouchableOpacity>
              ))}
            </View>
            {/* Signature */}
            {order.signature && (
              <View style={styles.signatureBox}>
                <Text style={styles.smallLabel}>Chữ ký khách hàng</Text>
                <Image
                  source={{ uri: order.signature }}
                  style={styles.signature}
                  resizeMode="contain"
                />
              </View>
            )}
            {/* Location */}
            {order.deliveryLocation && (
              <TouchableOpacity
                style={styles.row}
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/maps?q=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`,
                  )
                }
              >
                <Ionicons name="location-outline" size={14} color="#2563eb" />
                <Text style={styles.link}>Xem vị trí giao</Text>
              </TouchableOpacity>
            )}
            {/* Note */}
            {order.completionNote && (
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>"{order.completionNote}"</Text>
              </View>
            )}

            {/* {order.audioFiles?.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.audioTitle}>Ghi chú bằng âm thanh</Text>

                {order.audioFiles.map((audio: any, index: number) => {
                  const isCurrent = currentAudio === audio.url;

                  return (
                    <View key={index} style={styles.audioCard}>
                      <TouchableOpacity
                        onPress={() => toggleAudio(audio.url, index)}
                        style={[
                          styles.playBtn,
                          isCurrent && isPlaying && styles.playBtn,
                        ]}
                      >
                        <Ionicons
                          name={isCurrent && isPlaying ? "pause" : "play"}
                          size={18}
                          color="#fff"
                        />
                      </TouchableOpacity>

                      <View style={{ flex: 1 }}>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progress,
                              {
                                width: isCurrent
                                  ? `${progressMap[index] || 0}%`
                                  : "0%",
                              },
                            ]}
                          />
                        </View>

                        <View style={styles.timeRow}>
                          <Text style={styles.timeTextSmall}>
                            {isCurrent
                              ? currentTimeMap[index] || "0:00"
                              : "0:00"}
                          </Text>

                          <Text style={styles.timeTextSmall}>
                            {durationMap[index] || "0:00"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )} */}
          </View>
        )}

        {(order.status === "RETURNED_CUSTOMER" ||
          order.status === "ARCHIVED" ||
          order.status === "RETURNED_PERSONAL") && (
          <View style={[styles.card, { backgroundColor: "#fef2f2" }]}>
            <View style={styles.headerRow}>
              <Ionicons name="remove-circle" size={14} color="#dc2626" />
              <Text style={styles.returnTitle}>Thông tin hoàn trả</Text>
            </View>

            {order.returnedAt && (
              <Text style={styles.timeText}>
                ⏱ Hoàn trả lúc:{" "}
                <Text style={styles.timeError}>
                  {new Date(order.returnedAt).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </Text>
              </Text>
            )}

            {/* Images */}
            <View style={styles.imageGrid}>
              {order.returnImages?.map((img: string, i: number) => (
                <TouchableOpacity key={i} onPress={() => setPreviewImage(img)}>
                  <Image source={{ uri: img }} style={styles.image} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Location */}
            {order.returnLocation && (
              <TouchableOpacity
                style={styles.row}
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/maps?q=${order.returnLocation.lat},${order.returnLocation.lng}`,
                  )
                }
              >
                <Ionicons name="location-outline" size={14} color="#dc2626" />
                <Text style={[styles.link, { color: "#dc2626" }]}>
                  Xem vị trí hoàn trả
                </Text>
              </TouchableOpacity>
            )}

            {/* Reason */}
            {order.returnReason && (
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>"{order.returnReason}"</Text>
              </View>
            )}
          </View>
        )}

        {order.uploadedFiles?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tài liệu đính kèm</Text>

            {order.uploadedFiles.map((file: any, i: number) => (
              <TouchableOpacity
                key={i}
                style={styles.fileItem}
                onPress={() => downloadFile(file.data)}
              >
                <View style={styles.fileLeft}>
                  {file.type?.includes("image") ? (
                    <TouchableOpacity
                      onPress={() => setPreviewImage(file.data)}
                    >
                      <Image
                        source={{ uri: file.data }}
                        style={styles.fileImage}
                      />
                    </TouchableOpacity>
                  ) : (
                    <Ionicons
                      name={
                        file.type?.includes("pdf")
                          ? "document-text"
                          : "document"
                      }
                      size={22}
                      color="#6b7280"
                    />
                  )}

                  <View>
                    <Text style={styles.fileName}>{file.name}</Text>
                    <Text style={styles.fileType}>
                      {file.type?.split("/")[1]?.toUpperCase() || "FILE"}
                    </Text>
                  </View>
                </View>

                <Ionicons name="download-outline" size={16} color="#2563eb" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.createdInfo}>
          <Text style={styles.createdText}>
            Tạo bởi{" "}
            <Text style={styles.createdName}>
              {order.creatorName || "Admin"}
            </Text>{" "}
            vào lúc{" "}
            {new Date(order.createdAt).toLocaleString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </Text>
        </View>

        {hasActions && <View style={{ height: actionsHeight }} />}
      </ScrollView>

      {/* ACTION BUTTON */}
      {hasActions && (
        <View
          style={styles.actions}
          onLayout={(e) => setActionsHeight(e.nativeEvent.layout.height)}
        >
          {isQLAssign && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="git-branch-outline" size={18} color="#3B82F6" />
                <Text style={styles.cardTitle}>Xử lý đơn</Text>
              </View>

              <View style={styles.sectionHeader}>
                <Ionicons name="people-outline" size={16} color="#64748B" />
                <Text style={styles.smallLabel}>Chọn nhân viên giao nhận</Text>
              </View>

              <Dropdown
                style={styles.dropdown}
                containerStyle={styles.dropdownContainer}
                itemContainerStyle={styles.dropdownItemContainer}
                dropdownPosition="top"
                maxHeight={250}
                data={shipperOptions}
                labelField="name"
                valueField="value"
                placeholder="Chọn nhân viên giao nhận"
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownSelected}
                value={selectedShipper}
                onChange={(item) => setSelectedShipper(item.value)}
                renderLeftIcon={() => (
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={selectedShipper ? "#3B82F6" : "#94A3B8"}
                    style={{ marginRight: 8 }}
                  />
                )}
                renderItem={(item) => (
                  <View style={styles.itemRow}>
                    <View style={styles.itemLeft}>
                      <View>
                        <Text style={styles.itemName}>{item.name}</Text>
                      </View>
                    </View>

                    <View style={styles.itemRight}>
                      {item.activeOrders > 0 ? (
                        <View style={styles.busyBadge}>
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: "#EF4444" },
                            ]}
                          />
                          <Text style={styles.busyText}>
                            {item.activeOrders} đơn
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.freeBadge}>
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: "#22C55E" },
                            ]}
                          />
                          <Text style={styles.freeText}>Rảnh</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              />

              <View style={styles.rowButtons}>
                <TouchableOpacity
                  style={styles.supplementBtn}
                  onPress={() =>
                    navigation.navigate("SupplementScreen", {
                      id: order.id,
                      createdBy: order.createdBy,
                      orderCode: order.orderCode,
                      creator: order.creator,
                    })
                  }
                >
                  <Text style={styles.btnText}>Yêu cầu bổ sung</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.assignBtn}
                  disabled={!selectedShipper}
                  onPress={handleAssign}
                >
                  <Text style={styles.btnText}>Phân công</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {canPending && (
            <View style={styles.rowButtons}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => handleEdit()}
              >
                <Text style={styles.btnText}>Chỉnh sửa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => handleDelete(order.id)}
              >
                <Text style={styles.btnText}>Xoá đơn</Text>
              </TouchableOpacity>
            </View>
          )}
          {canSupplement && (
            <View style={styles.rowButtons}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => handleEdit()}
              >
                <Text style={styles.btnText}>Chỉnh sửa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => setSupplementModal(true)}
              >
                <Text style={styles.btnText}>Xác nhận bổ sung</Text>
              </TouchableOpacity>
            </View>
          )}
          {canAdminApprove && (
            <View style={styles.rowButtons}>
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => handleAdminFinalize(true)}
              >
                <Text style={styles.btnText}>Duyệt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => setFinalizeModal(true)}
              >
                <Text style={styles.btnText}>Không duyệt</Text>
              </TouchableOpacity>
            </View>
          )}
          {isQLReturned && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Xử lý đơn</Text>

              <View style={styles.rowButtons}>
                {/* Phân công lại */}
                {canReassign && (
                  <>
                    <TouchableOpacity
                      style={styles.supplementBtn}
                      onPress={() =>
                        navigation.navigate("SupplementScreen", {
                          id: order.id,
                          createdBy: order.createdBy,
                          orderCode: order.orderCode,
                          creator: order.creator,
                        })
                      }
                    >
                      <Text style={styles.btnText}>Yêu cầu bổ sung</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.assignBtn}
                      onPress={() =>
                        navigation.navigate("ReassignOrderScreen", {
                          id: order.id,
                          orderCode: order.orderCode,
                          attachments,
                          deliveryDate: order.date,
                          deliveryTime: order.time,
                        })
                      }
                    >
                      <Text style={styles.btnText}>Phân công lại</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.archiveBtn}
                      onPress={() => archiveReturnedHandler()}
                    >
                      <Text style={styles.btnText}>Lưu trữ đơn</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* Duyệt / Không duyệt */}
                {canApprove && (
                  <>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => managerApproveReturnHandler(true)}
                    >
                      <Text style={styles.btnText}>Duyệt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => setRejectReturnModal(true)}
                    >
                      <Text style={styles.btnText}>Không duyệt</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}
          {isNVGNAssigned && (
            <View style={styles.btnContainer}>
              <TouchableOpacity
                style={[styles.btnAccept, acceptLoading && styles.btnDisabled]}
                onPress={handleAcceptPress}
                disabled={acceptLoading}
                activeOpacity={0.7}
              >
                {acceptLoading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.btnText}> Đang xử lý...</Text>
                  </View>
                ) : (
                  <Text style={styles.btnText}>Nhận đơn</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnReject, acceptLoading && styles.btnDisabled]}
                onPress={() => setRejectModal(true)}
                disabled={acceptLoading}
              >
                <Text style={styles.btnText}>Từ chối</Text>
              </TouchableOpacity>
            </View>
          )}
          {isNVGNProcessing && (
            <View style={styles.btnContainer}>
              <TouchableOpacity style={styles.btnDone} onPress={handleComplete}>
                <Text style={styles.btnText}>Hoàn tất</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnReject}
                onPress={() => navigation.navigate("ReturnOrder", { id })}
              >
                <Text style={styles.btnText}>Hoàn đơn</Text>
              </TouchableOpacity>
            </View>
          )}
          {isNVGNArise && (
            <TouchableOpacity
              style={styles.btnArise}
              onPress={() => setAriseModal(true)}
              disabled={ariseLoading}
            >
              <Text style={styles.btnText}>Có phát sinh</Text>
            </TouchableOpacity>
          )}
          {isNVGNAriseReject && (
            <TouchableOpacity
              style={[styles.btnReject, acceptLoading && styles.btnDisabled]}
              onPress={() => setRejectModal(true)}
              disabled={acceptLoading}
            >
              <Text style={styles.btnText}>Từ chối</Text>
            </TouchableOpacity>
          )}
          {isAdminArise && (
            <TouchableOpacity
              style={styles.btnEditCustomer}
              onPress={openEditCustomer}
            >
              <Text style={styles.btnText}>Thay đổi thông tin khách hàng</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {previewImage && (
        <ImagePreviewModal
          visible={!!previewImage}
          image={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}

      <Modal visible={missingModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {/* HEADER */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hồ sơ còn thiếu</Text>
            </View>

            {/* SCROLL CONTENT */}
            <ScrollView style={styles.modalContent}>
              {missingDocs.map((d, i) => (
                <Text key={i} style={styles.missingItem}>
                  • {d.name} x{d.qty}
                </Text>
              ))}
            </ScrollView>

            {/* FOOTER */}
            <View style={styles.modalFooter}>
              {/* PICKUP */}
              {isPickup && (
                <TouchableOpacity
                  style={styles.btnAcceptMiss}
                  onPress={acceptWithMissing}
                >
                  <Text style={styles.btnText}>Hoàn tất (Ghi chú thiếu)</Text>
                </TouchableOpacity>
              )}

              {/* KHÔNG PHẢI PICKUP */}
              {!isPickup && (
                <>
                  <TouchableOpacity
                    style={styles.btnAcceptMiss}
                    onPress={acceptWithMissing}
                  >
                    <Text style={styles.btnText}>
                      Chấp nhận (Ghi chú thiếu)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnReturn}
                    onPress={() => setConfirmVisible(true)}
                  >
                    <Text style={styles.btnText}>Yêu cầu bổ sung (Trả về)</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* LUÔN CÓ */}
              <TouchableOpacity
                style={styles.btnBack}
                onPress={() => setMissingModal(false)}
              >
                <Text style={styles.btnBackText}>Trở lại kiểm tra</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={rejectModal} transparent animationType="fade">
        <View style={styles.modalOverlayReject}>
          <View style={styles.rejectModalBox}>
            {/* HEADER */}
            <View style={styles.rejectHeader}>
              <Ionicons name="close-circle-outline" size={20} color="#dc2626" />
              <Text style={styles.rejectTitle}>Lý do từ chối đơn</Text>
            </View>

            <Text style={styles.rejectSubtitle}>
              Vui lòng nhập hoặc chọn lý do từ chối để hệ thống thông báo lại
              cho trưởng phòng và admin.
            </Text>

            {/* INPUT */}
            <TextInput
              placeholder="Nhập lý do từ chối..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              style={styles.rejectInput}
            />

            {/* QUICK REASONS */}
            <Text style={styles.quickReasonsLabel}>
              Lý do thường gặp (Có thể chọn nhanh hoặc nhập nếu lí do khác):
            </Text>
            <View style={styles.quickReasonsContainer}>
              {rejectReasons.map((reason, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.quickReasonChip,
                    rejectReason === reason && styles.quickReasonChipActive,
                  ]}
                  onPress={() => setRejectReason(reason)}
                >
                  <Text
                    style={[
                      styles.quickReasonText,
                      rejectReason === reason && styles.quickReasonTextActive,
                    ]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* BUTTONS */}
            <View style={styles.rejectButtons}>
              <TouchableOpacity
                style={[
                  styles.rejectConfirmBtn,
                  !rejectReason.trim() && styles.btnDisabled,
                ]}
                onPress={confirmReject}
                disabled={!rejectReason.trim()}
              >
                <Ionicons name="close-outline" size={14} color="white" />
                <Text style={styles.rejectConfirmText}>Xác nhận từ chối</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectCancelBtn}
                onPress={() => {
                  setRejectModal(false);
                  setRejectReason("");
                }}
              >
                <Text style={styles.rejectCancelText}>Huỷ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={rejectReturnModal} transparent animationType="fade">
        <View style={styles.modalOverlayReject}>
          <View style={styles.rejectModalBox}>
            {/* HEADER */}
            <View style={styles.rejectHeader}>
              <Ionicons name="close-circle-outline" size={20} color="#dc2626" />
              <Text style={styles.rejectTitle}>
                Từ chối yêu cầu duyệt hoàn đơn
              </Text>
            </View>

            <Text style={styles.rejectSubtitle}>
              Khi từ chối, đơn này sẽ không được tính công cho nhân viên giao
              nhận.
            </Text>

            {/* INPUT */}
            <TextInput
              placeholder="Nhập lý do từ chối..."
              value={rejectReturnReason}
              onChangeText={setRejectReturnReason}
              multiline
              style={styles.rejectInput}
            />

            {/* BUTTONS */}
            <View style={styles.rejectButtons}>
              <TouchableOpacity
                style={styles.rejectConfirmBtn}
                onPress={() => managerApproveReturnHandler(false)}
              >
                <Ionicons name="close-outline" size={14} color="white" />
                <Text style={styles.rejectConfirmText}>Xác nhận từ chối</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectCancelBtn}
                onPress={() => setRejectReturnModal(false)}
              >
                <Text style={styles.rejectCancelText}>Huỷ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalBoxDesc}>
            <Text style={styles.modalTitle}>Xác nhận</Text>

            <Text style={styles.modalDesc}>
              Bạn có chắc chắn muốn yêu cầu bổ sung hồ sơ?
            </Text>

            <View style={styles.modalActionsDesc}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.cancelText}>Huỷ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={() => {
                  setConfirmVisible(false);
                  requestSupplement();
                }}
              >
                <Text style={styles.confirmText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={finalizeModal} transparent animationType="fade">
        <View style={styles.modalOverlayReject}>
          <View style={styles.rejectModalBox}>
            {/* HEADER */}
            <View style={styles.rejectHeader}>
              <Ionicons name="close-circle-outline" size={20} color="#dc2626" />
              <Text style={styles.rejectTitle}>Từ chối duyệt đơn</Text>
            </View>

            <Text style={styles.rejectSubtitle}>
              Vui lòng nhập lý do từ chối duyệt đơn hoàn tất.
            </Text>

            {/* INPUT */}
            <TextInput
              placeholder="Nhập lý do từ chối..."
              value={finalizeReason}
              onChangeText={setFinalizeReason}
              multiline
              style={styles.rejectInput}
            />

            {/* BUTTONS */}
            <View style={styles.rejectButtons}>
              <TouchableOpacity
                style={styles.rejectConfirmBtn}
                onPress={() => handleAdminFinalize(false)}
                disabled={finalizeLoading}
              >
                {finalizeLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="close-outline" size={14} color="white" />
                    <Text style={styles.rejectConfirmText}>
                      Xác nhận từ chối
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectCancelBtn}
                onPress={() => {
                  setFinalizeModal(false);
                  setFinalizeReason("");
                }}
                disabled={finalizeLoading}
              >
                <Text style={styles.rejectCancelText}>Huỷ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal nhập thông tin đã bổ sung */}
      <Modal visible={supplementModal} transparent animationType="fade">
        <View style={styles.modalOverlayReject}>
          <View style={styles.rejectModalBox}>
            {/* HEADER */}
            <View style={styles.rejectHeader}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#16a34a"
              />
              <Text style={[styles.rejectTitle, { color: "#16a34a" }]}>
                Xác nhận đã bổ sung hồ sơ
              </Text>
            </View>

            <Text style={styles.rejectSubtitle}>
              Vui lòng nhập chi tiết những hồ sơ đã bổ sung.
            </Text>

            {/* INPUT */}
            <TextInput
              placeholder="Nhập thông tin hồ sơ đã bổ sung..."
              value={supplementNote}
              onChangeText={setSupplementNote}
              multiline
              style={styles.rejectInput}
            />

            {/* BUTTONS */}
            <View style={styles.rejectButtons}>
              <TouchableOpacity
                style={[
                  styles.rejectConfirmBtn,
                  { backgroundColor: "#16a34a" },
                ]}
                onPress={handleResolveSupplement}
                disabled={supplementLoading}
              >
                {supplementLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-outline"
                      size={14}
                      color="white"
                    />
                    <Text style={styles.rejectConfirmText}>
                      Xác nhận đã bổ sung
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectCancelBtn}
                onPress={() => {
                  setSupplementModal(false);
                  setSupplementNote("");
                }}
                disabled={supplementLoading}
              >
                <Text style={styles.rejectCancelText}>Huỷ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal gửi yêu cầu phát sinh */}
      <Modal visible={ariseModal} transparent animationType="fade">
        <View style={styles.modalOverlayReject}>
          <View style={styles.rejectModalBox}>
            {/* HEADER */}
            <View style={styles.rejectHeader}>
              <Ionicons name="warning-outline" size={20} color="#f97316" />
              <Text style={[styles.rejectTitle, { color: "#f97316" }]}>
                Gửi yêu cầu phát sinh
              </Text>
            </View>

            <Text style={styles.rejectSubtitle}>
              Gửi yêu cầu phát sinh đến admin bàn giao hồ sơ.
            </Text>

            <Text
              style={[
                styles.rejectSubtitle,
                { fontStyle: "italic", color: "#9ca3af" },
              ]}
            >
              (Lý do phát sinh không bắt buộc)
            </Text>

            {/* INPUT */}
            <TextInput
              placeholder="Nhập lý do phát sinh (không bắt buộc)..."
              value={ariseReason}
              onChangeText={setAriseReason}
              multiline
              style={styles.rejectInput}
            />

            {/* BUTTONS */}
            <View style={styles.rejectButtons}>
              <TouchableOpacity
                style={[
                  styles.rejectConfirmBtn,
                  { backgroundColor: "#f97316" },
                ]}
                onPress={handleArise}
                disabled={ariseLoading}
              >
                {ariseLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send-outline" size={14} color="white" />
                    <Text style={styles.rejectConfirmText}>
                      Xác nhận gửi yêu cầu
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectCancelBtn}
                onPress={() => {
                  setAriseModal(false);
                  setAriseReason("");
                }}
                disabled={ariseLoading}
              >
                <Text style={styles.rejectCancelText}>Huỷ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal thay đổi thông tin khách hàng */}
      <Modal visible={editCustomerModal} transparent animationType="fade">
        <View style={styles.modalOverlayReject}>
          <View style={styles.editCustomerModalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* HEADER */}
              <View style={styles.rejectHeader}>
                <Ionicons
                  name="swap-horizontal-outline"
                  size={20}
                  color="#f97316"
                />
                <Text style={[styles.rejectTitle, { color: "#f97316" }]}>
                  Thêm thông tin khách hàng mới do có phát sinh
                </Text>
              </View>

              <Text style={styles.editCustomerHint}>
                Thông tin mới sẽ được hiển thị phía trên thông tin cũ.
                {order.contact || order.phone || order.address
                  ? " Bấm X để xóa và nhập giá trị mới."
                  : " Nhập thông tin mới vào các trường bên dưới."}
              </Text>

              {/* Contact */}
              <View style={styles.editFieldContainer}>
                <Text style={styles.editFieldLabel}>Người liên hệ mới</Text>
                <View style={styles.editInputWrapper}>
                  <TextInput
                    style={styles.editInput}
                    value={newContact}
                    onChangeText={setNewContact}
                    placeholder={order.contact || "Nhập người liên hệ mới..."}
                    placeholderTextColor="#9ca3af"
                  />
                  {newContact ? (
                    <TouchableOpacity
                      style={styles.editInputClearBtn}
                      onPress={() => setNewContact("")}
                    >
                      <Ionicons name="close" size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* Phone */}
              <View style={styles.editFieldContainer}>
                <Text style={styles.editFieldLabel}>Số điện thoại mới</Text>
                <View style={styles.editInputWrapper}>
                  <TextInput
                    style={styles.editInput}
                    value={newPhone}
                    onChangeText={setNewPhone}
                    placeholder={order.phone || "Nhập số điện thoại mới..."}
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                  />
                  {newPhone ? (
                    <TouchableOpacity
                      style={styles.editInputClearBtn}
                      onPress={() => setNewPhone("")}
                    >
                      <Ionicons name="close" size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* Address (Required) */}
              <View style={styles.editFieldContainer}>
                <Text style={styles.editFieldLabel}>
                  Địa chỉ mới <Text style={{ color: "#ef4444" }}>*</Text>
                </Text>
                <View style={styles.editInputWrapper}>
                  <TextInput
                    style={[
                      styles.editInput,
                      styles.editInputMultiline,
                      addressTouched && !newAddress && styles.editInputError,
                    ]}
                    value={newAddress}
                    onChangeText={(text) => {
                      setNewAddress(text);
                      if (!addressTouched) setAddressTouched(true);
                    }}
                    placeholder="Nhập địa chỉ (bắt buộc)..."
                    placeholderTextColor="#9ca3af"
                    multiline
                  />
                  {newAddress ? (
                    <TouchableOpacity
                      style={styles.editInputClearBtnMultiline}
                      onPress={() => {
                        setNewAddress("");
                        setAddressTouched(true);
                      }}
                    >
                      <Ionicons name="close" size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  ) : null}
                </View>
                {addressTouched && !newAddress ? (
                  <Text style={styles.editErrorText}>
                    Địa chỉ là bắt buộc, không được để trống
                  </Text>
                ) : null}
              </View>

              {/* BUTTONS */}
              <View style={styles.editCustomerButtons}>
                <TouchableOpacity
                  style={[
                    styles.rejectConfirmBtn,
                    { backgroundColor: "#f97316", flex: 1 },
                    (!canSaveCustomerInfo() || updateCustomerLoading) &&
                      styles.btnDisabled,
                  ]}
                  onPress={saveCustomerInfo}
                  disabled={!canSaveCustomerInfo() || updateCustomerLoading}
                >
                  {updateCustomerLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.rejectConfirmText}>Lưu thay đổi</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.rejectConfirmBtn,
                    { flex: 1, backgroundColor: "#b3b3b3" },
                  ]}
                  onPress={() => {
                    setEditCustomerModal(false);
                    setNewContact("");
                    setNewPhone("");
                    setNewAddress("");
                    setAddressTouched(false);
                  }}
                  disabled={updateCustomerLoading}
                >
                  <Text style={[styles.rejectCancelText, { color: "#000000" }]}>
                    Huỷ
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    color: "#374151",
  },

  cardTitleSuccess: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
    color: "#166534",
    flexDirection: "row",
    alignItems: "center",
  },

  returnTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#991b1b",
  },

  successText: {
    fontSize: 11,
    color: "#15803d",
    marginBottom: 6,
    lineHeight: 16,
  },

  company: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },

  value: {
    fontSize: 12,
    color: "#374151",
  },

  link: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "600",
    flex: 1,
    flexWrap: "wrap",
  },

  purpose: {
    fontSize: 12,
    color: "#dc2626",
    flex: 1,
    flexWrap: "wrap",
  },

  // checkItem: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   gap: 10,
  //   marginBottom: 10,
  // },

  // checkContent: {
  //   flex: 1,
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   alignItems: "center",
  // },

  // checkText: {
  //   fontSize: 14,
  //   flex: 1,
  //   flexWrap: "wrap",
  // },

  qtyText: {
    fontSize: 10,
    fontWeight: "bold",
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
  },

  actions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -2 },

    elevation: 10,
  },

  btnAccept: {
    backgroundColor: "#16a34a",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },

  btnReject: {
    backgroundColor: "#ef4444",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },

  btnDone: {
    backgroundColor: "#2563eb",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },

  btnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },

  checkHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },

  titleBox: {
    flex: 1,
    paddingRight: 8,
  },

  subtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 1,
    lineHeight: 14,
  },

  checkAllBtn: {
    color: "#2563eb",
    fontWeight: "600",
    fontSize: 11,
  },

  image: {
    width: 70,
    height: 70,
    borderRadius: 6,
    marginRight: 8,
  },

  signatureBox: {
    marginTop: 8,
  },

  signature: {
    width: "100%",
    height: 80,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    marginTop: 4,
  },

  smallLabel: {
    fontSize: 10,
    color: "#6b7280",
  },

  noteBox: {
    marginTop: 6,
    backgroundColor: "#f9fafb",
    padding: 8,
    borderRadius: 5,
  },

  noteText: {
    fontStyle: "italic",
    color: "#374151",
    fontSize: 11,
  },

  fileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },

  fileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  fileImage: {
    width: 30,
    height: 30,
    borderRadius: 4,
  },

  fileName: {
    fontSize: 12,
    fontWeight: "600",
  },

  fileType: {
    fontSize: 9,
    color: "#6b7280",
  },

  previewContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },

  previewImage: {
    width: "100%",
    height: "80%",
    resizeMode: "contain",
  },

  previewClose: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalActions: {
    marginTop: 12,
    gap: 8,
  },

  btnBack: {
    backgroundColor: "#6b7280",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },

  btnBackText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },

  btnReturn: {
    backgroundColor: "#ef4444",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },

  btnAcceptMiss: {
    backgroundColor: "#f59e0b",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },

  modalBox: {
    width: "85%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  },

  modalHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },

  modalTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  modalContent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  modalFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },

  missingItem: {
    color: "#dc2626",
    marginBottom: 6,
    fontSize: 12,
  },

  alertRed: {
    marginHorizontal: 10,
    marginTop: 6,
    backgroundColor: "#fef2f2",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fecaca",
  },

  alertRedText: {
    color: "#991b1b",
    fontSize: 11,
  },

  alertYellow: {
    marginHorizontal: 10,
    marginTop: 6,
    backgroundColor: "#fffbeb",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fde68a",
  },

  alertYellowText: {
    color: "#92400e",
    fontSize: 11,
  },

  alertGreen: {
    marginHorizontal: 10,
    marginTop: 6,
    backgroundColor: "#ecfdf5",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },

  alertGreenText: {
    color: "#065f46",
    fontSize: 11,
    fontWeight: "700",
  },

  creatorBox: {
    marginHorizontal: 10,
    marginTop: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 6,
    padding: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#2563eb",
  },

  creatorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },

  creatorLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1e40af",
  },

  creatorName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1f2937",
  },

  creatorEmail: {
    fontSize: 10,
    fontWeight: "400",
    color: "#6b7280",
    marginTop: 1,
  },

  header: {
    backgroundColor: "#ffffff",
    marginHorizontal: 10,
    marginTop: 6,
    padding: 12,
    borderRadius: 10,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  orderCode: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2563eb",
    marginBottom: 4,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 4,
  },

  infoBlock: {
    flexDirection: "column",
    gap: 3,
  },

  label: {
    fontSize: 9,
    color: "#6b7280",
    fontWeight: "600",
    textTransform: "uppercase",
  },

  deptBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },

  deptText: {
    fontSize: 10,
    fontWeight: "700",
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
  },

  statusText: {
    fontWeight: "700",
    fontSize: 10,
  },

  colorPicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    backgroundColor: "#f9fafb",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignSelf: "flex-start",
  },

  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },

  colorSelected: {
    borderWidth: 2,
    borderColor: "#111827",
  },

  clearColor: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6b7280",
    marginLeft: 2,
  },

  modalOverlayReject: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },

  rejectModalBox: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    elevation: 10,
  },

  rejectHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },

  rejectTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  rejectSubtitle: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 8,
  },

  rejectInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    minHeight: 70,
    textAlignVertical: "top",
    fontSize: 12,
    backgroundColor: "#f9fafb",
  },

  rejectButtons: {
    marginTop: 12,
  },

  rejectConfirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#dc2626",
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },

  rejectConfirmText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },

  rejectCancelBtn: {
    alignItems: "center",
    paddingVertical: 8,
    borderWidth: 1,
  },

  rejectCancelText: {
    color: "#6b7280",
    fontSize: 12,
  },

  selectBox: {
    marginTop: 6,
  },

  shipperItem: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
    marginBottom: 4,
  },

  shipperActive: {
    backgroundColor: "#2563eb",
  },

  shipperText: {
    color: "#374151",
    fontSize: 12,
  },

  shipperTextActive: {
    color: "white",
    fontWeight: "600",
  },

  rowButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 4,
  },

  assignBtn: {
    flex: 1,
    backgroundColor: "#2563eb",
    padding: 10,
    borderRadius: 6,
    marginRight: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  archiveBtn: {
    flex: 1,
    backgroundColor: "#7b25eb",
    padding: 10,
    borderRadius: 6,
    marginRight: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  supplementBtn: {
    flex: 1,
    backgroundColor: "#f97316",
    padding: 10,
    borderRadius: 6,
    marginLeft: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  assignedBox: {
    marginHorizontal: 10,
    marginTop: 6,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#2563eb",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  assignedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },

  assignedLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1e40af",
  },

  assignedName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },

  assignedEmail: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 1,
  },

  dropdownContainer: {
    borderRadius: 8,
    elevation: 10,
    zIndex: 9999,
  },

  dropdown: {
    height: 40,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: "white",
  },

  dropdownPlaceholder: {
    color: "#9ca3af",
    fontSize: 12,
  },

  dropdownSelected: {
    fontSize: 12,
    color: "#111827",
  },

  btnContainer: {
    gap: 8,
  },

  orderTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
  },

  orderTypeText: {
    fontWeight: "700",
    fontSize: 10,
    textTransform: "uppercase",
  },

  deliveryBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 5,
    alignSelf: "flex-start",
    marginBottom: 4,
    gap: 4,
    borderWidth: 1,
  },

  deliveryText: {
    fontSize: 11,
    fontWeight: "700",
  },

  paymentContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
    marginTop: 6,
  },

  paymentHeader: {
    marginBottom: 4,
  },

  paymentHeaderText: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  paymentIcon: {
    marginRight: 4,
    fontSize: 12,
  },

  paymentTextLine: {
    fontSize: 11,
    color: "#374151",
  },

  paymentHighlight: {
    fontWeight: "700",
    textTransform: "uppercase",
    paddingHorizontal: 3,
    borderRadius: 3,
    fontSize: 10,
  },

  collectText: {
    color: "#047857",
    backgroundColor: "#d1fae5",
  },

  payText: {
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
  },

  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },

  amountItem: {
    flexDirection: "column",
  },

  amountLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 1,
  },

  amountValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },

  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },

  rejectBtn: {
    backgroundColor: "#dc2626",
    flex: 1,
    padding: 10,
    borderRadius: 6,
    marginRight: 4,
    alignItems: "center",
  },

  approveBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    marginRight: 4,
    alignItems: "center",
    backgroundColor: "#16a34a",
  },

  editBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    marginRight: 4,
    alignItems: "center",
    backgroundColor: "#8a18be",
  },

  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,

    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#2563eb",

    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  exportText: {
    color: "#2563eb",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },

  timeText: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 6,
  },

  timeSuccess: {
    fontWeight: "600",
    color: "#15803d",
  },

  timeError: {
    fontWeight: "600",
    color: "#b91c1c",
  },

  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },

  priorityInlineBadge: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },

  priorityInlineText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.5,
  },

  purposeContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
    marginTop: 6,
  },

  purposeHeader: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 3,
  },

  purposeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1d4ed8",
  },

  createdInfo: {
    paddingTop: 6,
    paddingHorizontal: 10,
  },

  createdText: {
    fontSize: 10,
    color: "#6b7280",
    lineHeight: 16,
  },

  createdName: {
    fontWeight: "600",
    color: "#374151",
  },

  itemBox: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  checkItem: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 8,
  },

  checkContent: {
    flex: 1,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  checkText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },

  // qtyText: {
  //   fontSize: 12,
  //   color: "#374151",
  // },

  typeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 3,
    flexWrap: "wrap",
  },

  typeTag: {
    fontSize: 10,
  },

  detailText: {
    marginTop: 4,
    fontSize: 10,
    color: "#4b5563",
    fontStyle: "italic",
  },

  noteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },

  noteIcon: {
    fontSize: 10,
    color: "#f97316",
  },

  noteTextAtt: {
    marginTop: 3,
    fontSize: 10,
    color: "#f97316",
    fontStyle: "italic",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBoxDesc: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },

  modalTitleDesc: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111",
  },

  modalDesc: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 16,
  },

  modalActionsDesc: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },

  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  cancelBtn: {
    backgroundColor: "#f3f4f6",
  },

  confirmBtn: {
    backgroundColor: "#ef4444",
  },

  cancelText: {
    color: "#111",
    fontWeight: "600",
    fontSize: 12,
  },

  confirmText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },

  audioTitle: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 6,
  },

  audioCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 10,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  playBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#16A34A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  progressBar: {
    height: 3,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
  },

  progress: {
    height: "100%",
    backgroundColor: "#16A34A",
  },

  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 3,
  },

  timeTextSmall: {
    fontSize: 8,
    color: "#9CA3AF",
  },

  //   card: {
  //   backgroundColor: "#FFFFFF",
  //   borderRadius: 14,
  //   padding: 14,
  //   marginBottom: 12,
  //   borderWidth: 1,
  //   borderColor: "#F1F5F9",
  //   shadowColor: "#000",
  //   shadowOffset: { width: 0, height: 1 },
  //   shadowOpacity: 0.03,
  //   shadowRadius: 6,
  //   elevation: 2,
  // },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  // cardTitle: {
  //   fontSize: 14,
  //   fontWeight: "700",
  //   color: "#1E293B",
  // },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },

  // smallLabel: {
  //   fontSize: 12,
  //   fontWeight: "600",
  //   color: "#64748B",
  // },

  // Dropdown styles
  // dropdown: {
  //   borderWidth: 1,
  //   borderColor: "#E2E8F0",
  //   borderRadius: 10,
  //   paddingHorizontal: 12,
  //   height: 44,
  //   backgroundColor: "#F8FAFC",
  //   marginBottom: 12,
  // },

  // dropdownContainer: {
  //   borderRadius: 12,
  //   borderWidth: 1,
  //   borderColor: "#E2E8F0",
  //   marginTop: 4,
  //   shadowColor: "#000",
  //   shadowOffset: { width: 0, height: 4 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 12,
  //   elevation: 8,
  // },

  dropdownItemContainer: {
    borderRadius: 8,
  },

  // dropdownPlaceholder: {
  //   fontSize: 12,
  //   color: "#94A3B8",
  // },

  // dropdownSelected: {
  //   fontSize: 12,
  //   color: "#1E293B",
  //   fontWeight: "500",
  // },

  // Dropdown Item
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  itemAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  itemAvatarText: {
    fontSize: 13,
    fontWeight: "700",
  },

  itemName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 1,
  },

  itemStatus: {
    fontSize: 10,
    color: "#94A3B8",
  },

  itemRight: {
    alignItems: "flex-end",
  },

  busyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },

  freeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  busyText: {
    fontSize: 10,
    color: "#EF4444",
    fontWeight: "600",
  },

  freeText: {
    fontSize: 10,
    color: "#22C55E",
    fontWeight: "600",
  },

  // Buttons
  // rowButtons: {
  //   flexDirection: "row",
  //   gap: 8,
  //   marginTop: 4,
  // },

  // supplementBtn: {
  //   flex: 1,
  //   borderRadius: 10,
  //   overflow: "hidden",
  //   shadowColor: "#F59E0B",
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.3,
  //   shadowRadius: 4,
  //   elevation: 4,
  // },

  // assignBtn: {
  //   flex: 1,
  //   borderRadius: 10,
  //   overflow: "hidden",
  //   shadowColor: "#3B82F6",
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.3,
  //   shadowRadius: 4,
  //   elevation: 4,
  // },

  assignBtnDisabled: {
    opacity: 0.6,
    shadowColor: "#94A3B8",
  },

  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 4,
  },

  btnDisabled: {
    opacity: 0.6,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  creatorContactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 2,
  },

  phoneList: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginLeft: 4,
  },

  phoneItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
    marginVertical: 2,
    gap: 3,
  },

  creatorPhone: {
    fontSize: 10,
    color: "#2563eb",
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  btnArise: {
    backgroundColor: "#f97316",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
  },

  btnEditCustomer: {
    backgroundColor: "#f97316",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 8,
  },

  editCustomerModalBox: {
    width: "95%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    elevation: 10,
  },

  editCustomerHint: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 12,
    lineHeight: 16,
  },

  editFieldContainer: {
    marginBottom: 12,
  },

  editFieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },

  editFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  editFieldValue: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  editFieldValueText: {
    fontSize: 12,
    color: "#374151",
  },

  removeFieldBtn: {
    padding: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },

  editFieldInput: {
    borderWidth: 1,
    borderColor: "#f97316",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    backgroundColor: "#fff",
    color: "#111827",
  },

  oldValueText: {
    fontSize: 10,
    color: "#f97316",
    marginTop: 4,
  },

  editCustomerButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  // Thêm vào StyleSheet
  newCustomerCard: {
    marginHorizontal: 10,
    marginTop: 8,
    backgroundColor: "#fff7ed",
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: "#f97316",
    position: "relative",
  },

  newCustomerBadge: {
    position: "absolute",
    top: -10,
    left: 12,
    backgroundColor: "#f97316",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },

  newCustomerBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  oldCustomerCard: {
    opacity: 0.6,
    backgroundColor: "#f9fafb",
  },

  oldText: {
    color: "#9ca3af",
  },

  oldLink: {
    color: "#9ca3af",
  },

  dividerContainer: {
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 2,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    height: 20,
  },

  dividerLine: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderTopColor: "#d1d5db",
    borderStyle: "dashed",
  },

  dividerLabelContainer: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },

  dividerLabel: {
    fontSize: 9,
    color: "#9ca3af",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  editInputWrapper: {
    position: "relative",
  },

  editInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingRight: 36,
    paddingVertical: 10,
    fontSize: 13,
    backgroundColor: "#fff",
    color: "#111827",
  },

  editInputMultiline: {
    minHeight: 70,
    textAlignVertical: "top",
    paddingTop: 10,
  },

  editInputError: {
    borderColor: "#ef4444",
  },

  editInputClearBtn: {
    position: "absolute",
    right: 8,
    top: 10,
    padding: 2,
  },

  editInputClearBtnMultiline: {
    position: "absolute",
    right: 8,
    top: 10,
    padding: 2,
  },

  editErrorText: {
    fontSize: 11,
    color: "#ef4444",
    marginTop: 4,
  },
  quickReasonsLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 12,
    marginBottom: 8,
  },

  quickReasonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },

  quickReasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  quickReasonChipActive: {
    backgroundColor: "#dc2626",
    borderColor: "#dc2626",
  },

  quickReasonText: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "500",
  },

  quickReasonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
});
