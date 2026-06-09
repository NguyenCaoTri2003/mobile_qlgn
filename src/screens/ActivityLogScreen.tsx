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
  Animated,
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
  const [filterAnimation] = useState(new Animated.Value(0));

  const [filter, setFilter] = useState({
    user: "",
    orderCode: "",
    fromDate: "",
    toDate: "",
    actions: [] as string[],
  });

  const toggleFilter = () => {
    const newState = !showFilter;
    setShowFilter(newState);
    Animated.timing(filterAnimation, {
      toValue: newState ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

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
      if (customPage === 1) setLoading(true);

      const res = await logService.getLogs({
        page: customPage,
        ...customFilter,
      });

      setLogs((prevLogs) => {
        const newLogs =
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
    (filter.orderCode ? 1 : 0) +
    (filter.fromDate ? 1 : 0) +
    (filter.toDate ? 1 : 0) +
    filter.actions.length;

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
        <View style={styles.dateHeader}>
          <View style={styles.dateLine} />
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>{label}</Text>
          </View>
          <View style={styles.dateLine} />
        </View>
      );
    }

    const config = actionConfig[item.action] || {
      label: item.action,
      color: "#999",
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.userName || "Chưa có tên"}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {item.userEmail || "Không có email"}
            </Text>
          </View>

          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={12} color="#94A3B8" />
            <Text style={styles.timeText}>
              {new Date(item.timestamp).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
              {" - "}
              {new Date(item.timestamp).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={[styles.actionBadge, { backgroundColor: config.color }]}>
            <Text style={styles.actionText}>{config.label}</Text>
          </View>

          <View style={styles.orderBox}>
            <Ionicons name="cube-outline" size={14} color="#3B82F6" />
            <Text style={styles.orderText} numberOfLines={1}>
              {item.orderCode || item.orderId || "N/A"}
            </Text>
          </View>
        </View>

        {item.details && (
          <View style={styles.detailBox}>
            <Text style={styles.detailText}>
              {item.details}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchWrapper}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" />
            <TextInput
              placeholder="Tìm mã đơn hàng..."
              placeholderTextColor="#94A3B8"
              value={filter.orderCode}
              onChangeText={(t) => onChangeFilter("orderCode", t)}
              style={styles.searchInput}
            />
            {filter.orderCode !== "" && (
              <TouchableOpacity onPress={() => onChangeFilter("orderCode", "")}>
                <Ionicons name="close-circle" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.filterBtn,
              activeCount > 0 && styles.filterBtnActive,
            ]}
            onPress={toggleFilter}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={activeCount > 0 ? "#FFFFFF" : "#64748B"}
            />
            {activeCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Filter Tags */}
        {activeCount > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tagScroll}
            contentContainerStyle={styles.tagContent}
          >
            {filter.user !== "" && (
              <Tag
                label={`👤 ${filter.user}`}
                onPress={() => onChangeFilter("user", "")}
              />
            )}
            {filter.orderCode !== "" && (
              <Tag
                label={`📦 ${filter.orderCode}`}
                onPress={() => onChangeFilter("orderCode", "")}
              />
            )}
            {filter.fromDate !== "" && (
              <Tag
                label={`📅 ${filter.fromDate}`}
                onPress={() => onChangeFilter("fromDate", "")}
              />
            )}
            {filter.toDate !== "" && (
              <Tag
                label={`📅 ${filter.toDate}`}
                onPress={() => onChangeFilter("toDate", "")}
              />
            )}
            {filter.actions.map((action) => (
              <Tag
                key={action}
                label={actionConfig[action]?.label || action}
                color={actionConfig[action]?.color}
                onPress={() => toggleAction(action)}
              />
            ))}
            <TouchableOpacity onPress={resetFilter} style={styles.clearAllTag}>
              <Text style={styles.clearAllText}>Xóa tất cả</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* FILTER PANEL */}
      {showFilter && (
        <Animated.View
          style={[
            styles.filterPanel,
            {
              opacity: filterAnimation,
              transform: [
                {
                  translateY: filterAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.filterLabel}>Người dùng</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={16} color="#94A3B8" />
            <TextInput
              placeholder="Nhập tên hoặc email..."
              placeholderTextColor="#94A3B8"
              value={filter.user}
              onChangeText={(t) => onChangeFilter("user", t)}
              style={styles.filterInput}
            />
          </View>

          <Text style={styles.filterLabel}>Thời gian</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={[styles.inputWrapper, { flex: 1 }]}
              onPress={() => setShowFromPicker(true)}
            >
              <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
              <Text
                style={[
                  styles.dateText,
                  !filter.fromDate && styles.placeholder,
                ]}
                numberOfLines={1}
              >
                {filter.fromDate || "Từ ngày"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.dateArrow}>→</Text>

            <TouchableOpacity
              style={[styles.inputWrapper, { flex: 1 }]}
              onPress={() => setShowToPicker(true)}
            >
              <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
              <Text
                style={[styles.dateText, !filter.toDate && styles.placeholder]}
                numberOfLines={1}
              >
                {filter.toDate || "Đến ngày"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>Hành động</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setShowActionModal(true)}
          >
            <Ionicons name="flash-outline" size={16} color="#94A3B8" />
            <Text style={styles.actionFilterText} numberOfLines={1}>
              {filter.actions.length === 0
                ? "Chọn loại hành động"
                : `Đã chọn ${filter.actions.length} hành động`}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* SEARCH STATUS */}
      {/* {(filter.orderCode ||
        filter.user ||
        filter.actions.length > 0 ||
        filter.fromDate ||
        filter.toDate) && (
        <View style={styles.searchStatus}>
          <Text style={styles.searchStatusText} numberOfLines={2}>
            🔍 Tìm kiếm:
            {filter.orderCode ? ` mã "${filter.orderCode}"` : ""}
            {filter.user ? ` người dùng "${filter.user}"` : ""}
            {filter.actions.length > 0
              ? ` hành động: ${filter.actions
                  .map((a) => actionConfig[a]?.label)
                  .join(", ")}`
              : ""}
            {filter.fromDate || filter.toDate
              ? ` thời gian: ${filter.fromDate || "..."} → ${filter.toDate || "..."}`
              : ""}
          </Text>
        </View>
      )} */}

      {/* LIST */}
      <FlatList
        data={groupedLogs}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color="#CBD5E1"
              />
              <Text style={styles.emptyTitle}>Không có lịch sử hoạt động</Text>
              <Text style={styles.emptySubtitle}>
                Các hoạt động sẽ xuất hiện tại đây khi có thay đổi
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchLogs(1, filter).finally(() => setRefreshing(false));
            }}
            tintColor="#3B82F6"
            colors={["#3B82F6"]}
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
          if (isFetchingMore) {
            return (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.footerText}>Đang tải thêm...</Text>
              </View>
            );
          }

          if (page >= totalPages && logs.length > 0) {
            return (
              <View style={styles.footer}>
                <Text style={styles.footerDone}>Đã hiển thị tất cả</Text>
              </View>
            );
          }

          return null;
        }}
      />

      {/* DATE PICKERS */}
      {showFromPicker && (
        <DateTimePicker
          value={filter.fromDate ? new Date(filter.fromDate) : new Date()}
          mode="date"
          // Bỏ maximumDate để có thể chọn ngày tương lai
          onChange={(event, date) => {
            setShowFromPicker(false);
            if (event.type === "set" && date) {
              const formattedDate = formatDate(date);
              onChangeFilter("fromDate", formattedDate);

              // Nếu "đến ngày" đang có mà nhỏ hơn "từ ngày" mới chọn
              // thì tự động cập nhật "đến ngày" bằng "từ ngày"
              if (filter.toDate && new Date(filter.toDate) < date) {
                onChangeFilter("toDate", formattedDate);
              }
            }
          }}
        />
      )}

      {showToPicker && (
        <DateTimePicker
          value={
            filter.toDate
              ? new Date(filter.toDate)
              : filter.fromDate
                ? new Date(filter.fromDate) // Mặc định bắt đầu từ "từ ngày"
                : new Date()
          }
          mode="date"
          minimumDate={filter.fromDate ? new Date(filter.fromDate) : undefined}
          // Bỏ maximumDate để có thể chọn ngày trong tương lai
          onChange={(event, date) => {
            setShowToPicker(false);
            if (event.type === "set" && date) {
              onChangeFilter("toDate", formatDate(date));
            }
          }}
        />
      )}

      {/* ACTION MODAL */}
      <Modal visible={showActionModal} transparent animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowActionModal(false)}
        >
          <Pressable style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lọc theo hành động</Text>
              <TouchableOpacity onPress={() => setShowActionModal(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {Object.keys(actionConfig).map((a) => {
                const checked = filter.actions.includes(a);
                const config = actionConfig[a];

                return (
                  <TouchableOpacity
                    key={a}
                    style={[
                      styles.modalItem,
                      checked && styles.modalItemActive,
                    ]}
                    onPress={() => toggleAction(a)}
                  >
                    <View
                      style={[styles.dot, { backgroundColor: config.color }]}
                    />
                    <Text
                      style={[
                        styles.modalItemText,
                        checked && styles.modalItemTextActive,
                      ]}
                    >
                      {config.label}
                    </Text>
                    {checked && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#3B82F6"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalFooterBtn}
                onPress={clearActions}
              >
                <Text style={styles.modalFooterBtnText}>Đặt lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalFooterBtn, styles.modalFooterBtnPrimary]}
                onPress={() => setShowActionModal(false)}
              >
                <Text
                  style={[
                    styles.modalFooterBtnText,
                    styles.modalFooterBtnTextPrimary,
                  ]}
                >
                  Áp dụng
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// Tag Component
const Tag = ({ label, color, onPress }: any) => (
  <TouchableOpacity
    style={[styles.tag, color && { borderColor: color }]}
    onPress={onPress}
  >
    <Text style={[styles.tagText, color && { color }]} numberOfLines={1}>
      {label}
    </Text>
    <Ionicons name="close" size={14} color={color || "#64748B"} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  // Header
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    padding: 0,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  filterBtnActive: {
    backgroundColor: "#3B82F6",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  // Tags
  tagScroll: {
    marginTop: 8,
  },
  tagContent: {
    gap: 8,
    paddingRight: 12,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    gap: 6,
  },
  tagText: {
    fontSize: 12,
    color: "#64748B",
    maxWidth: 150,
  },
  clearAllTag: {
    backgroundColor: "#FEE2E2",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    justifyContent: "center",
  },
  clearAllText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
  },

  // Filter Panel
  filterPanel: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  filterInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    padding: 0,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  placeholder: {
    color: "#94A3B8",
  },
  dateArrow: {
    fontSize: 16,
    color: "#CBD5E1",
    fontWeight: "600",
  },
  actionFilterText: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
  },

  // Search Status
  searchStatus: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F0F9FF",
  },
  searchStatusText: {
    fontSize: 12,
    color: "#0369A1",
    fontStyle: "italic",
  },

  // Date Header
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    paddingHorizontal: 12,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dateBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginHorizontal: 10,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: "#6B7280",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  timeText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  actionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  orderBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flex: 1,
  },
  orderText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "500",
    flex: 1,
  },
  detailBox: {
    marginTop: 8,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },

  // List
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
  },

  // Footer
  footer: {
    paddingVertical: 20,
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: "#6B7280",
  },
  footerDone: {
    fontSize: 13,
    color: "#9CA3AF",
    fontStyle: "italic",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  modalItemActive: {
    backgroundColor: "#F0F9FF",
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  modalItemText: {
    flex: 1,
    fontSize: 14,
    color: "#334155",
  },
  modalItemTextActive: {
    color: "#0F172A",
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  modalFooterBtn: {
    flex: 1,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  modalFooterBtnPrimary: {
    backgroundColor: "#3B82F6",
  },
  modalFooterBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  modalFooterBtnTextPrimary: {
    color: "#FFFFFF",
  },
});
