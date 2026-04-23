import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
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

  const [notify, setNotify] = useState({
    visible: false,
    type: "success" as "success" | "error",
    message: "",
  });

  const fetchDetail = async () => {
    try {
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
    fetchDetail();
  }, [id]);

  useEffect(() => {
    if (user?.role === "QL") {
      fetchShippers();
    }
  }, [user?.role]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", gap: 5 }}>
          {user.role !== "NVGN" && (
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
          )}

          {/* Nút xuất đơn */}
          <TouchableOpacity onPress={handleExportDocx} style={styles.exportBtn}>
            <Ionicons name="download-outline" size={16} color="#2563eb" />
            <Text style={styles.exportText}>Xuất đơn</Text>
          </TouchableOpacity>
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
      console.log("Load shippers error:", err);
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

    if (role === "QL") {
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

  const handleAcceptPress = () => {
    if (isPickup) {
      handleAcceptPick();
    } else {
      handleAccept();
    }
  };

  const handleAccept = async () => {
    const missing = attachments.filter((a) => !a.checked);

    if (missing.length > 0) {
      setMissingDocs(missing);
      setMissingModal(true);
      return;
    }

    try {
      await orderService.shipperAccept(id, attachments, "");

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
    }
  };

  const handleAcceptPick = async () => {
    try {
      await orderService.shipperAcceptPick(id);
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

      console.log("PDF created:", uri);

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!order) {
    return (
      <NotFoundView
        title="Không tìm thấy đơn hàng"
        subtitle="Đơn có thể đã bị xoá hoặc bạn không có quyền xem."
        onBack={() => navigation.goBack()}
      />
    );
  }

  const isQLAssign =
    user?.role === "QL" &&
    (order?.status === "PENDING" ||
      order?.status === "REJECTED" ||
      order?.status === "SUPPLEMENT_REQUIRED");

  const isQLReturned =
    user?.role === "QL" &&
    (order?.status === "RETURNED_CUSTOMER" ||
      order?.status === "RETURNED_PERSONAL");

  // const isNVGNAssigned = user?.role === "NVGN" && order?.status === "ASSIGNED";
  const isNVGNAssigned =
    order?.status === "ASSIGNED" &&
    (user?.role === "NVGN" ||
      (user?.role === "QL" && order?.shipperId === user?.id));

  const isNVGNProcessing =
    order?.status === "PROCESSING" &&
    (user?.role === "NVGN" ||
      (user?.role === "QL" && order?.shipperId === user?.id));

  const hasActions =
    isQLAssign || isQLReturned || isNVGNAssigned || isNVGNProcessing;

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
    ["RETURNED_CUSTOMER", "RETURNED_PERSONAL"].includes(order?.status) &&
    (!approval || ["APPROVED", "REJECTED"].includes(approval));

  const canApprove =
    ["RETURNED_CUSTOMER", "RETURNED_PERSONAL"].includes(order?.status) &&
    approval === "PENDING";

  const deliveryStatus = getDeliveryStatus(
    order.date,
    order.time,
    order.status,
  );

  const shipperOptions = shippers.map((s) => ({
    label:
      s.stats?.active_orders > 0
        ? `${s.name} 🔴 ${s.stats.active_orders} đơn`
        : `${s.name} 🟢 Rảnh`,
    value: s.id,
  }));

  const deliveryStyle = getDeliveryStyle(order.date, order.time, order.status);

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 10 }}
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
                size={18}
                color="#2563eb"
              />
              <Text style={styles.creatorLabel}>Người yêu cầu</Text>
            </View>

            <Text style={styles.creatorName}>{order.senderName}</Text>
            <Text style={styles.creatorEmail}>{order.senderEmail || ""}</Text>
          </View>
        )}

        {order.missingDocs && (
          <View style={styles.alertRed}>
            <Text style={styles.alertRedText}>
              <Text style={{ fontWeight: "700" }}>Thiếu hồ sơ: </Text>
              {order.missingDocs}
            </Text>
          </View>
        )}

        {order.status === "REJECTED" && order.rejectionReason && (
          <View style={styles.alertRed}>
            <Text style={styles.alertRedText}>
              <Text style={{ fontWeight: "700" }}>Lý do từ chối: </Text>
              {order.rejectionReason}
            </Text>
          </View>
        )}

        {order.status === "SUPPLEMENT_REQUIRED" && order.supplementNote && (
          <View style={styles.alertYellow}>
            <Text style={styles.alertYellowText}>
              <Text style={{ fontWeight: "700" }}>Yêu cầu bổ sung: </Text>
              {order.supplementNote}
            </Text>
          </View>
        )}

        {order.adminResponse && (
          <View style={styles.alertGreen}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
              <Text style={styles.alertGreenText}>{order.adminResponse}</Text>
            </View>
          </View>
        )}

        {/* CUSTOMER CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Khách hàng</Text>

          <Text style={styles.company}>{order.company}</Text>

          <TouchableOpacity style={styles.row} onPress={call}>
            <Ionicons name="call-outline" size={18} color="#2563eb" />
            <Text style={styles.link}>
              {order.phone || "Không có số điện thoại"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={openMap}>
            <Ionicons name="location-outline" size={18} color="#2563eb" />
            <Text style={styles.link}>{order.address}</Text>
          </TouchableOpacity>

          <View style={styles.row}>
            <Ionicons name="person-outline" size={18} color="#6b7280" />
            <Text style={styles.value}>
              {order.contact || "Không có người liên hệ"}
            </Text>
          </View>
        </View>

        {/* DELIVERY INFO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin giao nhận</Text>

          <View
            style={[
              styles.deliveryBox,
              {
                backgroundColor: deliveryStyle.bg,
                borderColor: deliveryStyle.bg,
              },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={deliveryStyle.icon}
            />

            <Text style={[styles.deliveryText, { color: deliveryStyle.text }]}>
              {order.time || "Chưa có giờ"} •
              {order.date === new Date().toISOString().split("T")[0]
                ? " Hôm nay"
                : formatDate(order.date)}
              {deliveryStatus && (
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
                size={18}
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
                    size={22}
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
                            size={16}
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
              <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
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
                <Ionicons name="location-outline" size={18} color="#2563eb" />
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
              <Ionicons name="remove-circle" size={18} color="#dc2626" />
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
                <Ionicons name="location-outline" size={18} color="#dc2626" />
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
                      size={28}
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

                <Ionicons name="download-outline" size={20} color="#2563eb" />
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
              <Text style={styles.cardTitle}>Xử lý đơn</Text>

              <Text style={styles.smallLabel}>Chọn nhân viên giao nhận</Text>

              <Dropdown
                style={styles.dropdown}
                containerStyle={styles.dropdownContainer}
                dropdownPosition="top"
                maxHeight={250}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownSelected}
                data={shipperOptions}
                labelField="label"
                valueField="value"
                placeholder="Chọn nhân viên giao nhận"
                value={selectedShipper}
                onChange={(item) => setSelectedShipper(item.value)}
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

          {isQLReturned && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Xử lý đơn hoàn</Text>

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
                style={styles.btnAccept}
                onPress={handleAcceptPress}
              >
                <Text style={styles.btnText}>Nhận đơn</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnReject}
                onPress={() => setRejectModal(true)}
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
              <Ionicons name="close-circle-outline" size={26} color="#dc2626" />
              <Text style={styles.rejectTitle}>Từ chối đơn</Text>
            </View>

            <Text style={styles.rejectSubtitle}>
              Vui lòng nhập lý do từ chối để hệ thống thông báo lại cho admin.
            </Text>

            {/* INPUT */}
            <TextInput
              placeholder="Nhập lý do từ chối..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              style={styles.rejectInput}
            />

            {/* BUTTONS */}
            <View style={styles.rejectButtons}>
              <TouchableOpacity
                style={styles.rejectConfirmBtn}
                onPress={confirmReject}
              >
                <Ionicons name="close-outline" size={18} color="white" />
                <Text style={styles.rejectConfirmText}>Xác nhận từ chối</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectCancelBtn}
                onPress={() => setRejectModal(false)}
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
              <Ionicons name="close-circle-outline" size={26} color="#dc2626" />
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
                <Ionicons name="close-outline" size={18} color="white" />
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
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
    color: "#374151",
  },

  cardTitleSuccess: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
    color: "#166534",
    flexDirection: "row",
    alignItems: "center",
  },

  returnTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#991b1b",
  },

  successText: {
    fontSize: 13,
    color: "#15803d",
    marginBottom: 10,
    lineHeight: 18,
  },

  company: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },

  value: {
    fontSize: 14,
    color: "#374151",
  },

  link: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "600",
    flex: 1,
    flexWrap: "wrap",
  },

  purpose: {
    fontSize: 14,
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
    fontSize: 12,
    fontWeight: "bold",
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },

  actions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
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
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  btnReject: {
    backgroundColor: "#ef4444",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  btnDone: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  btnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
  },

  checkHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  titleBox: {
    flex: 1,
    paddingRight: 10,
  },

  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
    lineHeight: 16,
  },

  checkAllBtn: {
    color: "#2563eb",
    fontWeight: "600",
    fontSize: 13,
  },

  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
  },

  signatureBox: {
    marginTop: 12,
  },

  signature: {
    width: "100%",
    height: 120,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    marginTop: 6,
  },

  smallLabel: {
    fontSize: 12,
    color: "#6b7280",
  },

  noteBox: {
    marginTop: 10,
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 6,
  },

  noteText: {
    fontStyle: "italic",
    color: "#374151",
  },

  fileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },

  fileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  fileImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },

  fileName: {
    fontSize: 14,
    fontWeight: "600",
  },

  fileType: {
    fontSize: 11,
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
    marginTop: 16,
    gap: 10,
  },

  btnBack: {
    backgroundColor: "#6b7280",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },

  btnBackText: {
    color: "#fff",
    fontWeight: "600",
  },

  btnReturn: {
    backgroundColor: "#ef4444",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },

  btnAcceptMiss: {
    backgroundColor: "#f59e0b",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },

  modalBox: {
    width: "85%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
  },

  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  modalContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    gap: 10,
  },

  missingItem: {
    color: "#dc2626",
    marginBottom: 8,
    fontSize: 14,
  },

  alertRed: {
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },

  alertRedText: {
    color: "#991b1b",
    fontSize: 13,
  },

  alertYellow: {
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: "#fffbeb",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fde68a",
  },

  alertYellowText: {
    color: "#92400e",
    fontSize: 13,
  },

  alertGreen: {
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: "#ecfdf5",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },

  alertGreenText: {
    color: "#065f46",
    fontSize: 13,
    fontWeight: "700",
  },

  creatorBox: {
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#2563eb",
  },

  creatorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },

  creatorLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e40af",
  },

  creatorName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },

  creatorEmail: {
    fontSize: 12,
    fontWeight: "400",
    color: "#6b7280",
    marginTop: 2,
  },

  header: {
    backgroundColor: "#ffffff",
    marginHorizontal: 12,
    marginTop: 10,
    padding: 16,
    borderRadius: 12,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  orderCode: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2563eb",
    marginBottom: 6,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 6,
  },

  infoBlock: {
    flexDirection: "column",
    gap: 4,
  },

  label: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "600",
    textTransform: "uppercase",
  },

  deptBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },

  deptText: {
    fontSize: 11,
    fontWeight: "700",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusText: {
    fontWeight: "700",
    fontSize: 12,
  },

  colorPicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    backgroundColor: "#f9fafb",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },

  colorSelected: {
    borderWidth: 2,
    borderColor: "#111827",
  },

  clearColor: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
    marginLeft: 4,
  },

  modalOverlayReject: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  rejectModalBox: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },

  rejectHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },

  rejectTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  rejectSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 12,
  },

  rejectInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
    textAlignVertical: "top",
    fontSize: 14,
    backgroundColor: "#f9fafb",
  },

  rejectButtons: {
    marginTop: 16,
  },

  rejectConfirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#dc2626",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  rejectConfirmText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },

  rejectCancelBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },

  rejectCancelText: {
    color: "#6b7280",
    fontSize: 14,
  },

  selectBox: {
    marginTop: 8,
  },

  shipperItem: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    marginBottom: 6,
  },

  shipperActive: {
    backgroundColor: "#2563eb",
  },

  shipperText: {
    color: "#374151",
  },

  shipperTextActive: {
    color: "white",
    fontWeight: "600",
  },

  rowButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 5,
  },

  assignBtn: {
    flex: 1,
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  archiveBtn: {
    flex: 1,
    backgroundColor: "#7b25eb",
    padding: 12,
    borderRadius: 8,
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  supplementBtn: {
    flex: 1,
    backgroundColor: "#f97316",
    padding: 12,
    borderRadius: 8,
    marginLeft: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  assignedBox: {
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  assignedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },

  assignedLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e40af",
  },

  assignedName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  assignedEmail: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },

  dropdownContainer: {
    borderRadius: 10,
    elevation: 10,
    zIndex: 9999,
  },

  dropdown: {
    height: 48,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 6,
    marginBottom: 12,
    backgroundColor: "white",
  },

  dropdownPlaceholder: {
    color: "#9ca3af",
    fontSize: 14,
  },

  dropdownSelected: {
    fontSize: 14,
    color: "#111827",
  },

  btnContainer: {
    gap: 10,
  },

  orderTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  orderTypeText: {
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
  },

  deliveryBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 6,
    gap: 6,
    borderWidth: 1,
  },

  deliveryText: {
    fontSize: 13,
    fontWeight: "700",
  },

  paymentContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    marginTop: 10,
  },

  paymentHeader: {
    marginBottom: 6,
  },

  paymentHeaderText: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  paymentIcon: {
    marginRight: 6,
  },

  paymentTextLine: {
    fontSize: 13,
    color: "#374151",
  },

  paymentHighlight: {
    fontWeight: "700",
    textTransform: "uppercase",
    paddingHorizontal: 4,
    borderRadius: 4,
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
    marginTop: 6,
  },

  amountItem: {
    flexDirection: "column",
  },

  amountLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 2,
  },

  amountValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },

  rejectBtn: {
    backgroundColor: "#dc2626",
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginRight: 6,
    alignItems: "center",
  },

  approveBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginRight: 6,
    alignItems: "center",
    backgroundColor: "#16a34a",
  },

  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,

    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#2563eb",

    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  exportText: {
    color: "#2563eb",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },

  timeText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
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
    gap: 8,
    flexWrap: "wrap",
  },

  priorityInlineBadge: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },

  priorityInlineText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.5,
  },

  purposeContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    marginTop: 10,
  },

  purposeHeader: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 4,
  },

  purposeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1d4ed8",
  },

  createdInfo: {
    paddingTop: 10,
    paddingHorizontal: 12,
  },

  createdText: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
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
    gap: 10,
    paddingVertical: 10,
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
    fontSize: 14,
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
    gap: 8,
    marginTop: 4,
    flexWrap: "wrap",
  },

  typeTag: {
    fontSize: 11,
  },

  detailText: {
    marginTop: 6,
    fontSize: 12,
    color: "#4b5563",
    fontStyle: "italic",
  },

  noteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },

  noteIcon: {
    fontSize: 12,
    color: "#f97316",
  },

  noteTextAtt: {
    marginTop: 4,
    fontSize: 12,
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
    borderRadius: 16,
    padding: 20,
  },

  modalTitleDesc: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#111",
  },

  modalDesc: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },

  modalActionsDesc: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },

  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
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
  },

  confirmText: {
    color: "#fff",
    fontWeight: "600",
  },

  audioTitle: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },

  audioCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#16A34A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  progressBar: {
    height: 4,
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
    marginTop: 4,
  },

  timeTextSmall: {
    fontSize: 10,
    color: "#9CA3AF",
  },
});
