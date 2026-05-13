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
import { Ionicons } from "@expo/vector-icons";

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
      color: "#64748B",
    };

    const isLast = index === logs.length - 1;

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
              <Text style={styles.userName} numberOfLines={1}>
                {item.userName || "Hệ thống"}
              </Text>
            </View>

            <View
              style={[
                styles.badge,
                { backgroundColor: `${action.color}15` },
              ]}
            >
              <View style={[styles.badgeDot, { backgroundColor: action.color }]} />
              <Text style={[styles.badgeText, { color: action.color }]}>
                {action.label}
              </Text>
            </View>
          </View>

          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={11} color="#94A3B8" />
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
                <Text style={styles.detailsText} numberOfLines={3}>
                  {item.details}
                </Text>
              </View>
            </>
          )}

          {item.ipAddress && (
            <View style={styles.metaRow}>
              <Ionicons name="globe-outline" size={10} color="#94A3B8" />
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
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  }

  if (!loading && logs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={40} color="#CBD5E1" />
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
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "500",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 12,
    color: "#CBD5E1",
  },

  // List Container
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Timeline Row
  row: {
    flexDirection: "row",
  },
  timelineContainer: {
    width: 28,
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 3,
    borderWidth: 2,
    borderColor: "#FFFFFF",
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
    marginTop: 3,
    borderRadius: 1,
  },

  // Card Content
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
    marginLeft: 4,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: "#F1F5F9",
  },
  lastCard: {
    marginBottom: 0,
  },

  // Header Row
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    letterSpacing: -0.2,
  },

  // Badge
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    gap: 4,
    flexShrink: 0,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: -0.1,
  },

  // Time
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },

  // Details
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 8,
  },
  detailsContainer: {
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
  },
  detailsText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#334155",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    color: "#94A3B8",
  },
});