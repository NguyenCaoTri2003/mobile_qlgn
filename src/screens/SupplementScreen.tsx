import { useState } from "react";
import { useOrderContext } from "../contexts/OrderContext";
import { orderService } from "../services/order.service";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TextInput, TouchableOpacity } from "react-native";
import AppNotification from "../components/AppNotification";

export default function SupplementScreen({ route, navigation }: any) {
  const { id, orderCode, creator, createdBy } = route.params;

  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const [notify, setNotify] = useState({
    visible: false,
    type: "success" as "success" | "error",
    message: "",
  });

  const { reloadOrderCounts } = useOrderContext();

  const handleSubmit = async () => {
    if (!note.trim()) return;

    try {
      setLoading(true);

      await orderService.requestSupplement(
        id,
        note,
        createdBy,
        orderCode,
        creator,
      );

      setNotify({
        visible: true,
        type: "success",
        message: "Gửi yêu cầu bổ sung thành công",
      });

      await reloadOrderCounts();

      navigation.navigate("OrderList");
    } catch (err) {
      console.log("Supplement error:", err);
      setNotify({
        visible: true,
        type: "error",
        message: "Gửi yêu cầu bổ sung thất bại",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, padding: 16 }}
      edges={["left", "right", "bottom"]}
    >
      <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 12 }}>
        Yêu cầu bổ sung
      </Text>

      <TextInput
        placeholder="Nhập nội dung cần bổ sung..."
        multiline
        value={note}
        onChangeText={setNote}
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 8,
          padding: 12,
          height: 120,
          textAlignVertical: "top",
        }}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        style={{
          backgroundColor: "#f59e0b",
          padding: 14,
          borderRadius: 8,
          marginTop: 16,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>
          Gửi yêu cầu bổ sung
        </Text>
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
