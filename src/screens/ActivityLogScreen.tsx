import React, { useState, useCallback, useMemo } from "react";
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
  Dimensions,
  Animated,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import debounce from "lodash.debounce";
import { logService } from "../services/log.service";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { actionConfig } from "../utils/statusOrder";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

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

  // Animation cho filter panel
  const toggleFilter = () => {
    setShowFilter(!showFilter);
    Animated.timing(filterAnimation, {
      toValue: showFilter ? 0 : 1,
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
      setRefreshing(false);
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
    const newActions = filter.actions.includes(action)
      ? filter.actions.filter((a) => a !== action)
      : [...filter.actions, action];

    const newFilter = { ...filter, actions: newActions };
    setFilter(newFilter);
    setPage(1);
    fetchLogs(1, newFilter);
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
    setShowFilter(false);
  };

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const activeFilterCount = useMemo(() => {
    return (
      (filter.user ? 1 : 0) +
      (filter.orderCode ? 1 : 0) +
      (filter.fromDate ? 1 : 0) +
      (filter.toDate ? 1 : 0) +
      filter.actions.length
    );
  }, [filter]);

  const renderHeader = () => {
    const hasActiveFilters = activeFilterCount > 0;

    return (
      <View style={styles.header}>
        <LinearGradient
          colors={["#FFFFFF", "#F8FAFC"]}
          style={styles.headerGradient}
        >
          <View style={styles.searchContainer}>
            <View style={styles.searchWrapper}>
              <Ionicons
                name="search-outline"
                size={20}
                color="#94A3B8"
                style={styles.searchIcon}
              />
              <TextInput
                placeholder="Tìm theo mã đơn hàng..."
                placeholderTextColor="#94A3B8"
                value={filter.orderCode}
                onChangeText={(t) => onChangeFilter("orderCode", t)}
                style={styles.searchInput}
              />
              {filter.orderCode !== "" && (
                <TouchableOpacity
                  onPress={() => onChangeFilter("orderCode", "")}
                >
                  <Ionicons name="close-circle" size={18} color="#CBD5E1" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.filterButton,
                hasActiveFilters && styles.filterButtonActive,
              ]}
              onPress={toggleFilter}
            >
              <Ionicons
                name="options-outline"
                size={22}
                color={hasActiveFilters ? "#FFFFFF" : "#64748B"}
              />
              {hasActiveFilters && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {activeFilterCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Filter Tags */}
          {hasActiveFilters && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterTagsContainer}
              contentContainerStyle={styles.filterTagsContent}
            >
              {filter.user && (
                <FilterTag
                  label={`👤 ${filter.user}`}
                  onRemove={() => onChangeFilter("user", "")}
                />
              )}
              {filter.fromDate && (
                <FilterTag
                  label={`📅 Từ ${filter.fromDate}`}
                  onRemove={() => onChangeFilter("fromDate", "")}
                />
              )}
              {filter.toDate && (
                <FilterTag
                  label={`📅 Đến ${filter.toDate}`}
                  onRemove={() => onChangeFilter("toDate", "")}
                />
              )}
              {filter.actions.map((action) => (
                <FilterTag
                  key={action}
                  label={actionConfig[action]?.label || action}
                  color={actionConfig[action]?.color}
                  onRemove={() => toggleAction(action)}
                />
              ))}
              {activeFilterCount > 0 && (
                <TouchableOpacity
                  onPress={resetFilter}
                  style={styles.clearAllTag}
                >
                  <Text style={styles.clearAllText}>Xóa tất cả</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </LinearGradient>

        {/* Expandable Filter Panel */}
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
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <FilterSection
              filter={filter}
              onChangeFilter={onChangeFilter}
              onShowActionModal={() => setShowActionModal(true)}
              onShowFromPicker={() => setShowFromPicker(true)}
              onShowToPicker={() => setShowToPicker(true)}
            />
          </Animated.View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
      </View>
      <Text style={styles.emptyTitle}>Không có lịch sử hoạt động</Text>
      <Text style={styles.emptySubtitle}>
        Các hoạt động sẽ xuất hiện tại đây khi có thay đổi
      </Text>
      {activeFilterCount > 0 && (
        <TouchableOpacity style={styles.emptyResetButton} onPress={resetFilter}>
          <Text style={styles.emptyResetText}>Xóa bộ lọc</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderDateHeader = (date: string) => {
    const dateObj = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let displayDate = dateObj.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    if (dateObj.toDateString() === today.toDateString()) {
      displayDate = "Hôm nay";
    } else if (dateObj.toDateString() === yesterday.toDateString()) {
      displayDate = "Hôm qua";
    }

    return (
      <View style={styles.dateHeader}>
        <View style={styles.dateLine} />
        <View style={styles.dateBadge}>
          <Text style={styles.dateText}>{displayDate}</Text>
        </View>
        <View style={styles.dateLine} />
      </View>
    );
  };

  const renderLogItem = ({ item }: any) => {
    if (item.type === "header") {
      return renderDateHeader(item.date);
    }

    const config = actionConfig[item.action] || {
      label: item.action,
      color: "#64748B",
    };

    return (
      <View style={styles.logCard}>
        <View style={styles.logCardHeader}>
          <View style={styles.userSection}>
            {/* <View style={[styles.avatar, { backgroundColor: `${config.color}20` }]}>
              <Text style={[styles.avatarText, { color: config.color }]}>
                {(item.userName || "U").charAt(0).toUpperCase()}
              </Text>
            </View> */}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {item.userName || "Người dùng"}
              </Text>
              <Text style={styles.userEmail}>
                {item.userEmail || "Không có email"}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.actionBadge,
              { backgroundColor: `${config.color}15` },
            ]}
          >
            <View
              style={[styles.actionDot, { backgroundColor: config.color }]}
            />
            <Text style={[styles.actionText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        <View style={styles.logCardBody}>
          <View style={styles.orderInfo}>
            <Ionicons name="cube-outline" size={16} color="#3B82F6" />
            <Text style={styles.orderCode}>
              #{item.orderCode || item.orderId || "N/A"}
            </Text>
          </View>

          <View style={styles.timeInfo}>
            <View style={styles.timeItem}>
              <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
              <Text style={styles.timeText}>
                {new Date(item.timestamp).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </Text>
            </View>
            <View style={styles.timeDivider} />
            <View style={styles.timeItem}>
              <Ionicons name="time-outline" size={13} color="#94A3B8" />
              <Text style={styles.timeText}>
                {new Date(item.timestamp).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>
        </View>

        {item.details && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsText}>{item.details}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {renderHeader()}

      <FlatList
        data={groupedLogs}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderLogItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchLogs(1, filter);
            }}
            tintColor="#3B82F6"
            colors={["#3B82F6"]}
          />
        }
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (page < totalPages && !isFetchingMore && !loading) {
            setIsFetchingMore(true);
            const next = page + 1;
            setPage(next);
            fetchLogs(next, filter).finally(() => setIsFetchingMore(false));
          }
        }}
        ListFooterComponent={() => {
          if (isFetchingMore) {
            return (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color="#3B82F6" />
              </View>
            );
          }

          if (page >= totalPages && logs.length > 0) {
            return (
              <View style={styles.footer}>
                <View style={styles.endLine} />
                <Text style={styles.endText}>Đã hiển thị tất cả</Text>
                <View style={styles.endLine} />
              </View>
            );
          }

          return null;
        }}
      />

      {/* Date Pickers */}
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
          minimumDate={filter.fromDate ? new Date(filter.fromDate) : undefined}
          onChange={(event, date) => {
            setShowToPicker(false);
            if (event.type === "set" && date) {
              onChangeFilter("toDate", formatDate(date));
            }
          }}
        />
      )}

      {/* Action Filter Modal */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionModal(false)}
      >
        <BlurView intensity={20} style={styles.modalOverlay}>
          <Pressable
            style={styles.modalPressable}
            onPress={() => setShowActionModal(false)}
          >
            <Pressable style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Lọc theo hành động</Text>
                <TouchableOpacity onPress={() => setShowActionModal(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                {Object.entries(actionConfig).map(
                  ([key, config]: [string, any]) => {
                    const isSelected = filter.actions.includes(key);

                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.actionItem,
                          isSelected && styles.actionItemSelected,
                        ]}
                        onPress={() => toggleAction(key)}
                      >
                        <View
                          style={[
                            styles.actionItemDot,
                            { backgroundColor: config.color },
                          ]}
                        />
                        <Text
                          style={[
                            styles.actionItemText,
                            isSelected && styles.actionItemTextSelected,
                          ]}
                        >
                          {config.label}
                        </Text>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#3B82F6"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  },
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    onChangeFilter("actions", []);
                    setShowActionModal(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Đặt lại</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => setShowActionModal(false)}
                >
                  <Text style={styles.modalButtonTextPrimary}>Áp dụng</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}

// Component phụ cho Filter Tag
const FilterTag = ({ label, color, onRemove }: any) => (
  <View style={[styles.filterTag, color && { borderColor: color }]}>
    <Text style={[styles.filterTagText, color && { color }]}>{label}</Text>
    <TouchableOpacity onPress={onRemove} style={styles.filterTagRemove}>
      <Ionicons name="close" size={14} color={color || "#64748B"} />
    </TouchableOpacity>
  </View>
);

// Component phụ cho Filter Section
const FilterSection = ({
  filter,
  onChangeFilter,
  onShowActionModal,
  onShowFromPicker,
  onShowToPicker,
}: any) => (
  <View style={styles.filterSection}>
    <View style={styles.filterField}>
      <Text style={styles.filterLabel}>Người dùng</Text>
      <View style={styles.filterInputWrapper}>
        <Ionicons name="person-outline" size={18} color="#94A3B8" />
        <TextInput
          placeholder="Tìm theo tên hoặc email..."
          placeholderTextColor="#94A3B8"
          value={filter.user}
          onChangeText={(t) => onChangeFilter("user", t)}
          style={styles.filterInput}
        />
      </View>
    </View>

    <View style={styles.filterField}>
      <Text style={styles.filterLabel}>Thời gian</Text>
      <View style={styles.dateRangeContainer}>
        <TouchableOpacity style={styles.dateInput} onPress={onShowFromPicker}>
          <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
          <Text
            style={[
              styles.dateInputText,
              !filter.fromDate && styles.dateInputPlaceholder,
            ]}
          >
            {filter.fromDate || "Từ ngày"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.dateRangeArrow}>→</Text>

        <TouchableOpacity style={styles.dateInput} onPress={onShowToPicker}>
          <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
          <Text
            style={[
              styles.dateInputText,
              !filter.toDate && styles.dateInputPlaceholder,
            ]}
          >
            {filter.toDate || "Đến ngày"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>

    <View style={styles.filterField}>
      <Text style={styles.filterLabel}>Hành động</Text>
      <TouchableOpacity
        style={styles.actionFilterButton}
        onPress={onShowActionModal}
      >
        <Ionicons name="flash-outline" size={18} color="#64748B" />
        <Text style={styles.actionFilterButtonText}>
          {filter.actions.length === 0
            ? "Chọn loại hành động"
            : `Đã chọn ${filter.actions.length} hành động`}
        </Text>
        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  // Header Styles
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    padding: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  filterButtonActive: {
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

  // Filter Tags
  filterTagsContainer: {
    marginTop: 12,
  },
  filterTagsContent: {
    paddingRight: 16,
    gap: 8,
  },
  filterTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
  },
  filterTagText: {
    fontSize: 13,
    color: "#64748B",
    marginRight: 4,
  },
  filterTagRemove: {
    padding: 2,
  },
  clearAllTag: {
    backgroundColor: "#FEE2E2",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  clearAllText: {
    fontSize: 13,
    color: "#EF4444",
    fontWeight: "600",
  },

  // Filter Panel
  filterPanel: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  filterSection: {
    gap: 16,
  },
  filterField: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    letterSpacing: 0.3,
  },
  filterInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#0F172A",
  },
  dateRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dateInputText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#0F172A",
  },
  dateInputPlaceholder: {
    color: "#94A3B8",
  },
  dateRangeArrow: {
    fontSize: 16,
    color: "#CBD5E1",
    fontWeight: "600",
  },
  actionFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  actionFilterButtonText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#0F172A",
  },

  // Date Header
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dateBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 12,
  },
  dateText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },

  // Log Card
  logCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  logCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: "#64748B",
  },
  actionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  actionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  logCardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
    flexWrap: "wrap",
  },
  orderInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 0, 
  },
  orderCode: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "500",
    color: "#3B82F6",
    flex: 1,
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    flexShrink: 0, 
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 6,
  },
  timeText: {
    marginLeft: 4,
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  detailsContainer: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
  },
  detailsText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#334155",
  },

  // List Content
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
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyResetButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#3B82F6",
    borderRadius: 10,
  },
  emptyResetText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Footer
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  endLine: {
    width: 40,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  endText: {
    fontSize: 12,
    color: "#CBD5E1",
    marginVertical: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalPressable: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  actionItemSelected: {
    backgroundColor: "#F0F9FF",
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  actionItemDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  actionItemText: {
    flex: 1,
    fontSize: 15,
    color: "#334155",
  },
  actionItemTextSelected: {
    color: "#0F172A",
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  modalButton: {
    flex: 1,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  modalButtonPrimary: {
    backgroundColor: "#3B82F6",
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
  },
  modalButtonTextPrimary: {
    color: "#FFFFFF",
  },
});
