import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { orderService } from "../services/order.service";
import { usersService } from "../services/user.service";
import { useOrderContext } from "../contexts/OrderContext";
import AppNotification from "../components/AppNotification";
import { useAuth } from "../contexts/AuthContext";

export default function ReassignOrderScreen() {
  const route: any = useRoute();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [notify, setNotify] = useState({
    visible: false,
    type: "success" as "success" | "error",
    message: "",
  });

  const { reloadOrderCounts } = useOrderContext();

  const { id, orderCode, attachments } = route.params;

  const [loading, setLoading] = useState(false);
  const [shippers, setShippers] = useState<any[]>([]);
  const [selectedShipper, setSelectedShipper] = useState<number | null>(null);

  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<Date>(new Date());

  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  useEffect(() => {
    if (user?.role === "QL") {
      fetchShippers();
    }
  }, [user?.role]);

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
    if (!selectedShipper) return;

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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Phân công lại đơn hàng</Text>

      {/* DATE */}
      <Text style={styles.label}>Ngày giao</Text>

      <TouchableOpacity style={styles.input} onPress={() => setShowDate(true)}>
        <Text>{date.toLocaleDateString("vi-VN")}</Text>
      </TouchableOpacity>

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

      {/* TIME */}
      <Text style={styles.label}>Giờ giao</Text>

      <TouchableOpacity style={styles.input} onPress={() => setShowTime(true)}>
        <Text>
          {time.getHours().toString().padStart(2, "0")}:
          {time.getMinutes().toString().padStart(2, "0")}
        </Text>
      </TouchableOpacity>

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

      {/* SHIPPER */}
      <Text style={styles.label}>Chọn nhân viên giao nhận</Text>

      <Dropdown
        style={styles.dropdown}
        containerStyle={styles.dropdownContainer}
        data={shipperOptions}
        labelField="name"
        valueField="value"
        placeholder="Chọn nhân viên giao nhận"
        value={selectedShipper}
        onChange={(item) => setSelectedShipper(item.value)}
        renderItem={(item) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name}</Text>

            <View style={styles.itemRight}>
              {item.activeOrders > 0 ? (
                <Text style={styles.busyText}>🔴 {item.activeOrders} đơn</Text>
              ) : (
                <Text style={styles.freeText}>🟢 Rảnh</Text>
              )}
            </View>
          </View>
        )}
      />

      {/* BUTTON */}
      <TouchableOpacity
        style={[styles.button, !selectedShipper && { opacity: 0.5 }]}
        disabled={!selectedShipper || loading}
        onPress={handleSubmit}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Hoàn tất phân công</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "white",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },

  label: {
    marginTop: 16,
    marginBottom: 6,
    fontWeight: "600",
  },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 14,
  },

  dropdown: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 50,
  },

  dropdownContainer: {
    borderRadius: 10,
  },

  button: {
    marginTop: 30,
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
  },

  itemName: {
    fontSize: 14,
    fontWeight: "500",
  },

  itemRight: {
    alignItems: "flex-end",
  },

  busyText: {
    fontSize: 12,
    color: "#ef4444",
  },

  freeText: {
    fontSize: 12,
    color: "#22c55e",
  },
});
