import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import debounce from "lodash.debounce";
import { logService } from "../services/log.service";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { actionConfig } from "../utils/statusOrder";

export default function ActivityLogScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [groupedLogs, setGroupedLogs] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showActionModal, setShowActionModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const [filter, setFilter] = useState({
    user: "",
    orderCode: "",
    fromDate: "",
    toDate: "",
    actions: [] as string[],
  });

  const groupLogsByDate = (data: any[]) => {
    const map: any = {};
    data.forEach((item) => {
      const key = new Date(item.timestamp).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });

    const result: any[] = [];
    Object.keys(map)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .forEach((dateKey) => {
        result.push({ type: "header", date: dateKey });
        map[dateKey].forEach((item: any) =>
          result.push({ type: "item", ...item }),
        );
      });

    return result;
  };

  const fetchLogs = async (customPage = 1, customFilter = filter) => {
    try {
      setLoading(true);

      const res = await logService.getLogs({
        page: customPage,
        ...customFilter,
      });

      let newLogs =
        customPage === 1
          ? res.data
          : [
              ...logs,
              ...res.data.filter(
                (item: any) => !logs.some((p) => p.id === item.id),
              ),
            ];

      setLogs((prevLogs) => {
        let newLogs =
          customPage === 1
            ? res.data
            : [
                ...prevLogs,
                ...res.data.filter(
                  (item: any) => !prevLogs.some((p) => p.id === item.id),
                ),
              ];

        setGroupedLogs(groupLogsByDate(newLogs));
        return newLogs;
      });
      setGroupedLogs(groupLogsByDate(newLogs));
      setTotalPages(res.totalPages);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLogs(1, filter);
      setPage(1);
    }, [filter]),
  );

  const debounceSearch = useCallback(
    debounce((newFilter) => {
      setPage(1);
      fetchLogs(1, newFilter);
    }, 400),
    [],
  );

  const onChangeFilter = (key: string, value: any) => {
    const newFilter = { ...filter, [key]: value };
    setFilter(newFilter);
    debounceSearch(newFilter);
  };

  const toggleAction = (action: string) => {
    let newActions = [...filter.actions];

    if (newActions.includes(action)) {
      newActions = newActions.filter((a) => a !== action);
    } else {
      newActions.push(action);
    }

    const newFilter = { ...filter, actions: newActions };
    setFilter(newFilter);
    setPage(1);
    fetchLogs(1, newFilter);
  };

  const clearActions = () => {
    const newFilter = { ...filter, actions: [] };
    setFilter(newFilter);
    setPage(1);
    fetchLogs(1, newFilter);
    setShowActionModal(false);
  };

  const resetFilter = () => {
    const empty = {
      user: "",
      orderCode: "",
      fromDate: "",
      toDate: "",
      actions: [],
    };
    setFilter(empty);
    setPage(1);
    fetchLogs(1, empty);
    setShowActionModal(false);
    setShowFilter(false);
  };

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const activeCount =
    (filter.user ? 1 : 0) +
    (filter.fromDate ? 1 : 0) +
    (filter.toDate ? 1 : 0) +
    (filter.actions.length > 1 ? 1 : 0);

  const highlight = (text: string, keyword: string) => {
    if (!keyword) return <Text>{text}</Text>;

    const parts = text.split(new RegExp(`(${keyword})`, "gi"));

    return (
      <Text>
        {parts.map((part, i) => (
          <Text
            key={i}
            style={
              part.toLowerCase() === keyword.toLowerCase()
                ? { backgroundColor: "yellow" }
                : {}
            }
          >
            {part}
          </Text>
        ))}
      </Text>
    );
  };

  const renderItem = ({ item }: any) => {
    if (item.type === "header") {
      const date = new Date(item.date);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let label = date.toLocaleDateString("vi-VN");

      if (date.toDateString() === today.toDateString()) {
        label = "Hôm nay";
      } else if (date.toDateString() === yesterday.toDateString()) {
        label = "Hôm qua";
      }

      return (
        <Text style={{ margin: 10, fontWeight: "bold", color: "#6b7280" }}>
          {label}
        </Text>
      );
    }

    const config = actionConfig[item.action] || {};

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.user}>
            {highlight(`${item.userName || "Chưa có tên"}`, filter.user)}
          </Text>

          <Text style={styles.time}>
            {new Date(item.timestamp).toLocaleTimeString("vi-VN")} -{" "}
            {new Date(item.timestamp).toLocaleDateString("vi-VN")}
          </Text>
        </View>

        <Text style={styles.email}>
          {highlight(item.userEmail, filter.user)}
        </Text>

        <View style={styles.row}>
          <View
            style={[styles.badge, { backgroundColor: config.color || "#999" }]}
          >
            <Text style={styles.badgeText}>{config.label || item.action}</Text>
          </View>

          <View style={styles.orderBox}>
            <Ionicons name="cube-outline" size={14} color="#2563eb" />
            <Text style={styles.order}>
              {highlight(
                item.orderCode || item.orderId || "",
                filter.orderCode,
              )}
            </Text>
          </View>
        </View>

        <Text style={styles.detail}>{item.details}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f3f4f6" }}
      edges={["left", "right"]}
    >
      <View
        style={{
          backgroundColor: "#fff",
          paddingHorizontal: 10,
          paddingTop: 8,
        }}
      >
        <Text style={styles.label}>Mã đơn</Text>

        <View style={styles.searchBar}>
          <TextInput
            placeholder="Nhập mã đơn..."
            value={filter.orderCode}
            onChangeText={(t) => onChangeFilter("orderCode", t)}
            style={styles.searchInput}
          />

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowFilter(!showFilter)}
          >
            <Ionicons name="options-outline" size={20} />
            {activeCount > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeTextSmall}>{activeCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={resetFilter}>
            <Ionicons name="refresh-outline" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {showFilter && (
        <View style={styles.filterBox}>
          {/* USER */}
          <Text style={styles.label}>Người dùng</Text>
          <TextInput
            placeholder="Nhập tên hoặc email..."
            value={filter.user}
            onChangeText={(t) => onChangeFilter("user", t)}
            style={styles.input}
          />

          {/* DATE */}
          <Text style={styles.label}>Thời gian</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              style={[styles.input, { flex: 1 }]}
              onPress={() => setShowFromPicker(true)}
            >
              <Text>{filter.fromDate || "Từ ngày"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.input, { flex: 1 }]}
              onPress={() => setShowToPicker(true)}
            >
              <Text>{filter.toDate || "Đến ngày"}</Text>
            </TouchableOpacity>
          </View>

          {/* ACTION */}
          <Text style={styles.label}>Hành động</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowActionModal(true)}
          >
            <Ionicons name="filter-outline" size={16} />
            <Text style={{ marginLeft: 6 }}>
              {filter.actions.length === 0
                ? "Chọn hành động"
                : `${filter.actions.length} đã chọn`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {(filter.orderCode ||
        filter.user ||
        filter.actions.length > 0 ||
        filter.fromDate ||
        filter.toDate) && (
        <View style={styles.searchStatus}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Text style={styles.searchStatusText}>
              Tìm kiếm:
              {filter.orderCode ? ` "${filter.orderCode}"` : ""}
              {filter.user ? ` • ${filter.user}` : ""}
              {filter.actions.length > 0
                ? ` • ${filter.actions
                    .map((a) => actionConfig[a]?.label)
                    .join(", ")}`
                : ""}
              {filter.fromDate || filter.toDate
                ? ` • ${filter.fromDate || "..."} → ${filter.toDate || "..."}`
                : ""}
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={groupedLogs}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchLogs(1, filter)}
          />
        }
        onEndReachedThreshold={0.3}
        onEndReached={async () => {
          if (page < totalPages && !isFetchingMore) {
            setIsFetchingMore(true);
            const next = page + 1;
            setPage(next);
            await fetchLogs(next, filter);
            setIsFetchingMore(false);
          }
        }}
        ListFooterComponent={() => {
          if (loading) {
            return (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.footerText}>Đang tải thêm...</Text>
              </View>
            );
          }

          if (page >= totalPages && logs.length > 0) {
            return (
              <View style={styles.footer}>
                <Text style={styles.footerDone}>
                  Đã hiển thị tất cả đơn hàng
                </Text>
              </View>
            );
          }

          return null;
        }}
      />

      {/* DATE PICKER */}
      {showFromPicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          onChange={(event, date) => {
            setShowFromPicker(false);

            if (event.type === "set" && date) {
              onChangeFilter("fromDate", formatDate(date));
            }
          }}
        />
      )}

      {showToPicker && (
        <DateTimePicker
          value={filter.fromDate ? new Date(filter.fromDate) : new Date()}
          mode="date"
          onChange={(event, date) => {
            setShowToPicker(false);

            if (event.type === "set" && date) {
              onChangeFilter("toDate", formatDate(date));
            }
          }}
        />
      )}

      <Modal visible={showActionModal} transparent animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowActionModal(false)}
        >
          <Pressable style={styles.modal}>
            <Text style={styles.modalTitle}>Lọc hành động</Text>

            <ScrollView>
              {Object.keys(actionConfig).map((a) => {
                const checked = filter.actions.includes(a);
                const config = actionConfig[a];

                return (
                  <TouchableOpacity
                    key={a}
                    style={styles.modalItem}
                    onPress={() => toggleAction(a)}
                  >
                    <View
                      style={[styles.dot, { backgroundColor: config.color }]}
                    />
                    <Text style={{ flex: 1 }}>{config.label}</Text>

                    {checked && (
                      <Ionicons name="checkmark" size={18} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={clearActions}>
                <Text style={styles.clearText}>Bỏ chọn tất cả</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f9fafb",
  },
  iconBtn: {
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeCount: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 5,
  },
  badgeTextSmall: { color: "#fff", fontSize: 10 },

  filterBox: { padding: 12, backgroundColor: "#fff" },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
  },

  filterButton: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  user: {
    fontWeight: "700",
    fontSize: 14,
    color: "#111827",
  },

  email: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },

  time: {
    fontSize: 11,
    color: "#9ca3af",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },

  orderBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  order: {
    marginLeft: 4,
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "500",
  },

  detail: {
    marginTop: 10,
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
  },
  modalTitle: { fontWeight: "bold", marginBottom: 10 },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    marginTop: 10,
    alignItems: "flex-end",
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },

  label: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
    marginTop: 6,
  },

  searchStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    marginBottom: 6,
    marginTop: 10,
  },

  searchStatusText: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
    flex: 1,
  },

  clearText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
  },

  footer: {
    paddingVertical: 20,
    paddingBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  footerText: {
    fontSize: 13,
    color: "#6b7280",
  },

  footerDone: {
    fontSize: 13,
    color: "#9ca3af",
    fontStyle: "italic",
  },
});
