import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { actionConfig } from "../utils/statusOrder";
import { logService } from "../services/log.service";

export default function OrderLogsScreen() {
  const route = useRoute<any>();
  const { orderId } = route.params;

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const res = await logService.getLogs({
        orderId,
        page: 1,
      });

      setLogs(res.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  const renderItem = ({ item, index }: any) => {
    const action = actionConfig[item.action] || {
      label: item.action,
      color: "#64748B", // fallback màu xám đẹp
    };

    const isLast = index === logs.length - 1;
    const userInitial = item.userName
      ? item.userName.charAt(0).toUpperCase()
      : "S";

    return (
      <View style={styles.row}>
        {/* Timeline */}
        <View style={styles.timelineContainer}>
          <View style={[styles.dot, { backgroundColor: action.color }]} />
          {!isLast && <View style={styles.line} />}
        </View>

        {/* Card */}
        <View style={[styles.card, isLast && styles.lastCard]}>
          <View style={styles.headerRow}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.userName || "Hệ thống"}</Text>
            </View>

            <View
              style={[
                styles.badge,
                { backgroundColor: `${action.color}15` }, 
              ]}
            >
              <Text style={[styles.badgeText, { color: action.color }]}>
                {action.label}
              </Text>
            </View>
          </View>

          <View style={styles.timeContainer}>
            <Text style={styles.timeIcon}>🕒</Text>
            <Text style={styles.timeText}>
              {new Date(item.timestamp).toLocaleString("vi-VN", {
                hour12: false,
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>

          {item.details && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsText}>{item.details}</Text>
              </View>
            </>
          )}

          {/* Có thể thêm IP hoặc Device nếu có trong logs */}
          {item.ipAddress && (
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>IP: {item.ipAddress}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!loading && logs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Không có lịch sử thao tác</Text>
        <Text style={styles.emptySubtext}>Dữ liệu sẽ xuất hiện tại đây</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={logs}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#3B82F6"
          colors={["#3B82F6"]}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 15,
    color: "#94A3B8",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#CBD5E1",
    marginTop: 4,
  },

  // --- List Container ---
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },

  // --- Timeline Row ---
  row: {
    flexDirection: "row",
    marginBottom: 0, // margin sẽ được xử lý bởi line bên dưới để tránh khoảng trắng thừa
  },
  timelineContainer: {
    width: 32,
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    // Shadow cho dot để nổi bật hơn
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#E2E8F0",
    marginTop: 4,
    borderRadius: 1,
  },

  // --- Card Content ---
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 20,
    marginLeft: 4,
    // Modern Shadow (Soft & Deep)
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    // Subtle Border
    borderWidth: 0.5,
    borderColor: "#F1F5F9",
  },
  // Điều chỉnh cho item cuối cùng để không có line kéo dài thừa
  lastCard: {
    marginBottom: 0,
  },

  // --- Header Row (User & Badge) ---
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    letterSpacing: -0.2,
  },

  // --- Badge ---
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    // Nền sẽ được style inline dựa trên action.color + '20' (opacity)
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: -0.1,
    // Màu sẽ được style inline
  },

  // --- Time & Meta ---
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  timeIcon: {
    marginRight: 4,
    opacity: 0.6,
  },
  timeText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },

  // --- Details & Extra Info ---
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
  },
  detailsContainer: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  detailsText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#334155",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: "#94A3B8",
    marginLeft: 4,
  },
});
