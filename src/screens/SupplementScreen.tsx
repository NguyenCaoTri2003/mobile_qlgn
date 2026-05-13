import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useOrderContext } from "../contexts/OrderContext";
import { orderService } from "../services/order.service";
import { SafeAreaView } from "react-native-safe-area-context";
import AppNotification from "../components/AppNotification";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function SupplementScreen({ route, navigation }: any) {
  const { id, orderCode, creator, createdBy, creatorName } = route.params;

  const [note, setNote] = useState("");
  const [noteTouched, setNoteTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const [notify, setNotify] = useState({
    visible: false,
    type: "success" as "success" | "error",
    message: "",
  });

  const { reloadOrderCounts } = useOrderContext();

  const handleSubmit = async () => {
    setNoteTouched(true);

    if (!note.trim()) {
      setNotify({
        visible: true,
        type: "error",
        message: "Vui lòng nhập nội dung cần bổ sung",
      });
      return;
    }

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

      setTimeout(() => {
        navigation.navigate("OrderList");
      }, 500);
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

  const isValid = note.trim().length > 0;
  const showError = noteTouched && !isValid;

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <LinearGradient
                colors={["#F59E0B", "#D97706"]}
                style={styles.headerIconGradient}
              >
                <Ionicons name="add-circle-outline" size={28} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Yêu cầu bổ sung</Text>
              <Text style={styles.headerSubtitle}>
                Đơn hàng #{orderCode || id}
              </Text>
            </View>
          </View>

          {/* Note Input */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={18} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Nội dung cần bổ sung *</Text>
            </View>

            <TextInput
              placeholder="Nhập nội dung cần bổ sung..."
              placeholderTextColor="#94A3B8"
              multiline
              value={note}
              onChangeText={(text) => {
                setNote(text);
                if (!noteTouched && text.length > 0) setNoteTouched(true);
              }}
              onBlur={() => setNoteTouched(true)}
              style={[
                styles.noteInput,
                showError && styles.noteInputError,
              ]}
              textAlignVertical="top"
            />

            <View style={styles.noteFooter}>
              {showError && (
                <Text style={styles.errorHint}>
                  * Bắt buộc nhập nội dung cần bổ sung
                </Text>
              )}
              <Text style={styles.charCount}>
                {note.length} ký tự
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (!isValid || loading) && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isValid || loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                !isValid || loading
                  ? ["#94A3B8", "#64748B"]
                  : ["#F59E0B", "#D97706"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.submitText}> Đang gửi yêu cầu...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="send-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.submitText}> Gửi yêu cầu bổ sung</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

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
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  headerInfo: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },

  // Info Card
  infoCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  infoLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },

  infoValue: {
    fontSize: 13,
    color: "#92400E",
    fontWeight: "600",
    flex: 1,
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
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },

  // Note Input
  noteInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    minHeight: 140,
    fontSize: 13,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
    lineHeight: 20,
  },

  noteInputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },

  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },

  errorHint: {
    fontSize: 11,
    color: "#EF4444",
    fontWeight: "500",
  },

  charCount: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
    marginLeft: "auto",
  },

  // Submit Button
  submitBtn: {
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#F59E0B",
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