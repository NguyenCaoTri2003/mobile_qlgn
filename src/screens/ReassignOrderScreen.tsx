import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { orderService } from "../services/order.service";
import { usersService } from "../services/user.service";
import { useOrderContext } from "../contexts/OrderContext";
import AppNotification from "../components/AppNotification";
import { useAuth } from "../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReassignOrderScreen() {
  const parseDateTime = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return new Date();

    return new Date(`${dateStr}T${timeStr}:00`);
  };

  const route: any = useRoute();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [notify, setNotify] = useState({
    visible: false,
    type: "success" as "success" | "error",
    message: "",
  });

  const { reloadOrderCounts } = useOrderContext();

  const { id, orderCode, attachments, deliveryDate, deliveryTime } =
    route.params;

  const [loading, setLoading] = useState(false);
  const [shippers, setShippers] = useState<any[]>([]);
  const [selectedShipper, setSelectedShipper] = useState<number | null>(null);

  const [date, setDate] = useState<Date>(
    deliveryDate ? new Date(deliveryDate) : new Date(),
  );

  const [time, setTime] = useState<Date>(
    deliveryTime ? parseDateTime(deliveryDate, deliveryTime) : new Date(),
  );

  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  
  const [dateError, setDateError] = useState("");
  const [timeError, setTimeError] = useState("");
  const [isDateTimeValid, setIsDateTimeValid] = useState(true);

  useEffect(() => {
    if (user?.role === "QL") {
      fetchShippers();
    }
  }, [user?.role]);

  useEffect(() => {
    validateDateTime();
  }, [date, time]);

  const validateDateTime = () => {
    const now = new Date();
    let isValid = true;
    let currentDateError = "";
    let currentTimeError = "";

    const selectedDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      0,
      0
    );

    const selectedDateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const todayDateOnly = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    if (selectedDateOnly < todayDateOnly) {
      currentDateError = "Ngày giao nhận không được nhỏ hơn ngày hiện tại";
      isValid = false;
    } else if (selectedDateOnly.getTime() === todayDateOnly.getTime()) {
      if (selectedDateTime <= now) {
        currentTimeError = "Giờ giao nhận không được nhỏ hơn giờ hiện tại";
        isValid = false;
      }
    }

    setDateError(currentDateError);
    setTimeError(currentTimeError);
    setIsDateTimeValid(isValid);
  };

  const fetchShippers = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const res = await usersService.getShippersStats(today);

      setShippers(res);
    } catch (err) {
      console.log("Load shippers error:", err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedShipper || !isDateTimeValid) return;

    try {
      setLoading(true);

      const shipper = shippers.find((s) => s.id === selectedShipper);

      const attachmentIds = attachments.map((a: any) => a.id);

      const dateStr = date.toISOString().split("T")[0];

      const timeStr =
        time.getHours().toString().padStart(2, "0") +
        ":" +
        time.getMinutes().toString().padStart(2, "0");

      await orderService.reassignOrder(
        id,
        orderCode,
        shipper.id,
        shipper.email,
        shipper.name,
        dateStr,
        timeStr,
        attachmentIds,
      );

      setNotify({
        visible: true,
        type: "success",
        message: "Phân công lại nhân viên giao hàng thành công",
      });

      await reloadOrderCounts();

      navigation.navigate("OrderList");
    } catch (err) {
      console.log("Reassign error:", err);
      setNotify({
        visible: true,
        type: "error",
        message: "Phân công lại nhân viên giao hàng thất bại",
      });
    } finally {
      setLoading(false);
    }
  };

  const shipperOptions = shippers.map((s) => ({
    name: s.name,
    activeOrders: s.stats?.active_orders || 0,
    value: s.id,
  }));

  // Check if form is valid for submission
  const isFormValid = selectedShipper && isDateTimeValid && !loading;

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <LinearGradient
              colors={["#3B82F6", "#2563EB"]}
              style={styles.headerIconGradient}
            >
              <Ionicons name="swap-horizontal-outline" size={24} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Phân công lại đơn hàng</Text>
            <Text style={styles.headerSubtitle}>
              Đơn #{orderCode || id}
            </Text>
          </View>
        </View>

        {/* Date Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={18} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Ngày giao nhận</Text>
          </View>

          <TouchableOpacity
            style={[styles.inputCard, dateError ? styles.inputCardError : null]}
            onPress={() => setShowDate(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar" size={18} color={dateError ? "#EF4444" : "#64748B"} />
            <Text style={[styles.inputText, dateError && styles.inputTextError]}>
              {date.toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#CBD5E1" />
          </TouchableOpacity>
          
          {dateError ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{dateError}</Text>
            </View>
          ) : null}

          {showDate && (
            <DateTimePicker
              value={date}
              mode="date"
              onChange={(e, d) => {
                setShowDate(false);
                if (d) setDate(d);
              }}
            />
          )}
        </View>

        {/* Time Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={18} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Giờ giao nhận</Text>
          </View>

          <TouchableOpacity
            style={[styles.inputCard, timeError ? styles.inputCardError : null]}
            onPress={() => setShowTime(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="time" size={18} color={timeError ? "#EF4444" : "#64748B"} />
            <Text style={[styles.inputText, timeError && styles.inputTextError]}>
              {time.getHours().toString().padStart(2, "0")}:
              {time.getMinutes().toString().padStart(2, "0")}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#CBD5E1" />
          </TouchableOpacity>
          
          {timeError ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{timeError}</Text>
            </View>
          ) : null}

          {showTime && (
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour
              onChange={(e, d) => {
                setShowTime(false);
                if (d) setTime(d);
              }}
            />
          )}
        </View>

        {/* Shipper Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={18} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Chọn nhân viên giao nhận</Text>
          </View>

          <Dropdown
            style={styles.dropdown}
            containerStyle={styles.dropdownContainer}
            itemContainerStyle={styles.dropdownItemContainer}
            data={shipperOptions}
            labelField="name"
            valueField="value"
            placeholder="Chọn nhân viên giao nhận"
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelectedText}
            value={selectedShipper}
            onChange={(item) => setSelectedShipper(item.value)}
            renderLeftIcon={() => (
              <Ionicons
                name="person-outline"
                size={18}
                color={selectedShipper ? "#3B82F6" : "#94A3B8"}
                style={{ marginRight: 8 }}
              />
            )}
            renderItem={(item) => (
              <View style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  {/* <View style={[
                    styles.itemAvatar,
                    { backgroundColor: item.activeOrders > 0 ? "#FEE2E2" : "#DCFCE7" }
                  ]}>
                    <Text style={[
                      styles.itemAvatarText,
                      { color: item.activeOrders > 0 ? "#EF4444" : "#22C55E" }
                    ]}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View> */}
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {/* <Text style={styles.itemStatus}>
                      {item.activeOrders > 0 ? "Đang bận" : "Sẵn sàng"}
                    </Text> */}
                  </View>
                </View>

                <View style={styles.itemRight}>
                  {item.activeOrders > 0 ? (
                    <View style={styles.busyBadge}>
                      <View style={[styles.statusDot, { backgroundColor: "#EF4444" }]} />
                      <Text style={styles.busyText}>{item.activeOrders} đơn</Text>
                    </View>
                  ) : (
                    <View style={styles.freeBadge}>
                      <View style={[styles.statusDot, { backgroundColor: "#22C55E" }]} />
                      <Text style={styles.freeText}>Rảnh</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, !isFormValid && styles.submitBtnDisabled]}
          disabled={!isFormValid}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={!isFormValid ? ["#94A3B8", "#64748B"] : ["#3B82F6", "#2563EB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.submitText}> Đang xử lý...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.submitText}> Hoàn tất phân công</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

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
    backgroundColor: "#F8FAFC",
  },

  scrollContent: {
    padding: 12,
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    gap: 14,
  },

  headerIcon: {
    flexShrink: 0,
  },

  headerIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  headerInfo: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 3,
  },

  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },

  // Section
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
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },

  // Input Card
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },

  inputCardError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },

  inputText: {
    flex: 1,
    fontSize: 13,
    color: "#1E293B",
    fontWeight: "500",
  },

  inputTextError: {
    color: "#EF4444",
  },

  // Error
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    marginLeft: 4,
  },

  errorText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "500",
  },

  // Dropdown
  dropdown: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: "#F8FAFC",
  },

  dropdownContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  dropdownItemContainer: {
    borderRadius: 8,
  },

  dropdownPlaceholder: {
    fontSize: 13,
    color: "#94A3B8",
  },

  dropdownSelectedText: {
    fontSize: 13,
    color: "#1E293B",
    fontWeight: "500",
  },

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
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  itemAvatarText: {
    fontSize: 14,
    fontWeight: "700",
  },

  itemName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },

  itemStatus: {
    fontSize: 11,
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
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },

  freeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  busyText: {
    fontSize: 11,
    color: "#EF4444",
    fontWeight: "600",
  },

  freeText: {
    fontSize: 11,
    color: "#22C55E",
    fontWeight: "600",
  },

  // Submit Button
  submitBtn: {
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#3B82F6",
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
    gap: 6,
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