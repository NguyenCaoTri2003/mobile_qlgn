import React, { useEffect, useState, useCallback, use } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DraggableFlatList from "react-native-draggable-flatlist";
import { Ionicons } from "@expo/vector-icons";
import debounce from "lodash.debounce";
import { useFocusEffect } from "@react-navigation/native";

import { orderService } from "../services/order.service";
import {
  getOrderTypeLabel,
  getOrderTypeStyle,
  getOrderTypeTextStyle,
  getStatusBorderColor,
  statusColor,
  statusLabel,
  statusTextColor,
} from "../utils/statusOrder";
import { authService } from "../services/auth.service";
import { getDeptColor, getDeptTextColor } from "../utils/departmentColor";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useOrderContext } from "../contexts/OrderContext";
import {
  formatDate,
  getDeliveryStatus,
  getDeliveryStyle,
} from "../utils/dateUtils";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Dropdown } from "react-native-element-dropdown";
import { departmentService } from "../services/department.service";
import { useAuth } from "../contexts/AuthContext";
import { EmptyState } from "../components/EmptyComponent";
import { usersService } from "../services/user.service";
import AppNotification from "../components/AppNotification";

export default function OrderListScreen({ navigation, route }: any) {
  const PAGE_SIZE = 10;
  const { user, loading: useLoading } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [initialized, setInitialized] = useState(false);
  const [timeFilter, setTimeFilter] = useState("");

  const hasMore = page < totalPages;
  const tabHeight = useBottomTabBarHeight();
  const { pendingOrdersCount } = useOrderContext();

  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [deptFilter, setDeptFilter] = useState("");
  const [deptFocus, setDeptFocus] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  const [orderTypeFilter, setOrderTypeFilter] = useState("");

  const canDrag = user?.role === "NVGN";

  const [showFilters, setShowFilters] = useState(false);

  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const isQL = user?.role === "QL";
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [shippers, setShippers] = useState<any[]>([]);
  const [selectedShipper, setSelectedShipper] = useState<any>(null);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [excludedOrders, setExcludedOrders] = useState<number[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const [fromDashboardOnce, setFromDashboardOnce] = useState(false);

  const [notify, setNotify] = useState({
    visible: false,
    type: "success" as "success" | "error",
    message: "",
  });

  const fetchShippers = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const res = await usersService.getShippersStats(today);

      setShippers(res);
    } catch (err) {
      console.log("Load shippers error:", err);
    }
  };

  const fetchPendingCount = async () => {
    const res = await orderService.countByFilter({
      search,
      deptFilter,
      filter,
      dateFilter,
      timeFilter,
      statusFilter,
      orderTypeFilter,
    });

    setPendingCount(res.pending);
  };

  const toggleAll = async () => {
    if (isSelectAll) {
      resetSelection();
    } else {
      setIsSelectAll(true);
      setSelectedOrders([]);
      setExcludedOrders([]);

      await fetchPendingCount();
    }
  };

  const isSelected = (order: any) => {
    if (isSelectAll) {
      return (
        ["PENDING", "REJECTED"].includes(order.status) &&
        !excludedOrders.includes(order.id)
      );
    }

    return selectedOrders.includes(order.id);
  };

  const toggleSelect = (order: any) => {
    if (!["PENDING", "REJECTED"].includes(order.status)) return;

    if (isSelectAll) {
      setExcludedOrders((prev) => {
        if (prev.includes(order.id)) {
          return prev.filter((id) => id !== order.id);
        }
        return [...prev, order.id];
      });

      return;
    }

    setSelectedOrders((prev) => {
      if (prev.includes(order.id)) {
        return prev.filter((id) => id !== order.id);
      }
      return [...prev, order.id];
    });
  };

  const getSelectedCount = () => {
    if (isSelectAll) {
      return pendingCount - excludedOrders.length;
    }

    return selectedOrders.length;
  };

  const confirmBulkAssign = async () => {
    if (!selectedShipper) return;

    try {
      if (isSelectAll) {
        console.log("chạy ở assignByFilter");
        await orderService.assignByFilter(
          {
            search,
            dept: deptFilter,
            filter,
            date: dateFilter,
            time: timeFilter,
            status: statusFilter,
            orderType: orderTypeFilter,
            excludedIds: excludedOrders,
          },
          selectedShipper,
        );
      } else {
        console.log("chạy ở assignMultiple");
        await orderService.assignMultiple(
          selectedOrders,
          selectedShipper.id,
          selectedShipper.email,
          selectedShipper.name,
        );
      }

      setNotify({
        visible: true,
        type: "success",
        message: "Phân công đơn hàng thành công",
      });

      resetSelection();
      setShowAssignModal(false);
      fetchOrders(1);
    } catch (err: any) {
      console.log("Assign error:", err);

      setNotify({
        visible: true,
        type: "error",
        message: `Phân công thất bại: ${err?.response?.data?.message} || ${err?.message}`,
      });
    }
  };

  const resetSelection = () => {
    setSelectedOrders([]);
    setExcludedOrders([]);
    setIsSelectAll(false);
    setSelectedShipper(null);
  };

  useEffect(() => {
    if (user?.role === "QL") {
      fetchShippers();
    }
  }, [user?.role]);

  const shipperOptions = shippers.map((s) => ({
    label:
      s.stats?.active_orders > 0
        ? `${s.name} 🔴 ${s.stats.active_orders} đơn`
        : `${s.name} 🟢 Rảnh`,
    value: s.id,
    id: s.id,
    name: s.name,
    email: s.email,
  }));

  const activeFilterCount = [
    dateFilter,
    deptFilter,
    timeFilter,
    orderTypeFilter,
    statusFilter.length > 0 ? "status" : "",
  ].filter(Boolean).length;

  useEffect(() => {
    if (route.params?.openOrderId) {
      navigation.navigate("OrderDetail", {
        id: route.params.openOrderId,
      });
    }
  }, [route.params?.openOrderId]);

  useEffect(() => {
    const loadDepartments = async () => {
      const data = await departmentService.loadDepartments();
      setDepartments(data);
    };

    loadDepartments();
  }, []);

  const fetchOrders = async (
    pageNum = 1,
    isLoadMore = false,
    keyword = search,
    dept = deptFilter,
    filterVal = filter,
    date = dateFilter,
    time = timeFilter,
    status = statusFilter,
    orderType = orderTypeFilter,
  ) => {
    try {
      if (pageNum === 1 && !isLoadMore) setLoading(true);
      if (isLoadMore) setLoadingMore(true);

      const res = await orderService.getOrders(
        pageNum,
        PAGE_SIZE,
        keyword,
        dept,
        filterVal,
        date || "",
        time,
        status.join(","),
        orderType,
      );

      const newData = res.data || [];

      if (isLoadMore) {
        setOrders((prev) => [...prev, ...newData]);
      } else {
        setOrders(newData);
      }

      setTotalPages(res.totalPages || 1);
      setPage(pageNum);

      fetchPendingCount();
    } catch (err) {
      console.log("Load orders error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const nvgnStatuses = [
    "ASSIGNED",
    "PROCESSING",
    "COMPLETED",
    "FINISHED",
    "INCOMPLETE",
  ];

  const allStatuses = [
    { value: "PENDING", label: "Chờ tiếp nhận", color: "#b91c1c" },
    { value: "ASSIGNED", label: "Đã điều phối", color: "#1d4ed8" },
    { value: "PROCESSING", label: "Đang thực hiện", color: "#a16207" },
    { value: "SUPPLEMENT_REQUIRED", label: "Cần bổ sung", color: "#c2410c" },
    {
      value: "RETURNED_CUSTOMER",
      label: "Hoàn đơn (Khách hàng)",
      color: "#b91c1c",
    },
    {
      value: "RETURNED_PERSONAL",
      label: "Hoàn đơn (Cá nhân)",
      color: "#374151",
    },
    { value: "COMPLETED", label: "Đã xong", color: "#6d28d9" },
    { value: "FINISHED", label: "Hoàn tất", color: "#15803d" },
    { value: "REJECTED", label: "Từ chối", color: "#374151" },
    { value: "INCOMPLETE", label: "Chưa hoàn thành", color: "#dc2626" },
  ];

  const statuses =
    user?.role === "NVGN"
      ? allStatuses.filter((s) => nvgnStatuses.includes(s.value))
      : allStatuses;

  const tabs = React.useMemo(() => {
    const baseTabs = [
      { key: "ALL", label: "Tất cả" },
      { key: "TODAY", label: "Giao hôm nay" },
      { key: "PENDING_GROUP", label: "Cần xử lý" },
      { key: "DONE_GROUP", label: "Hoàn tất" },
    ];

    if (user?.role === "NVGN") {
      return [
        baseTabs.find((t) => t.key === "TODAY"),
        baseTabs.find((t) => t.key === "ALL"),
        baseTabs.find((t) => t.key === "PENDING_GROUP"),
        baseTabs.find((t) => t.key === "DONE_GROUP"),
      ].filter(Boolean);
    }

    return baseTabs;
  }, [user]);

  const buildFiltersFromParams = (params: any) => {
    const hasOnlyFilter =
      params?.filter &&
      !params?.status &&
      !params?.dept &&
      !params?.date &&
      !params?.time &&
      !params?.orderType;

    if (hasOnlyFilter) {
      return {
        search: "",
        dept: "",
        date: null,
        time: "",
        orderType: "",
        filter: params.filter,
        status: [],
      };
    }

    return {
      search: "",
      dept: params?.dept || "",
      date: params?.date || null,
      time: params?.time || "",
      orderType: params?.orderType || "",
      filter: params?.filter || "ALL",
      status: Array.isArray(params?.status)
        ? params.status
        : params?.status
          ? [params.status]
          : [],
    };
  };

  useEffect(() => {
    if (!user) return;

    const newFilter = user.role === "NVGN" ? "TODAY" : "ALL";

    setFilter(newFilter);
    setInitialized(true);
  }, [user]);

  useEffect(() => {
    if (!route.params?.fromDashboard) return;

    const f = buildFiltersFromParams(route.params);

    setSearch(f.search);
    setDeptFilter(f.dept);
    setDateFilter(f.date);
    setTimeFilter(f.time);
    setOrderTypeFilter(f.orderType);
    setFilter(f.filter);
    setStatusFilter(f.status);

    fetchOrders(
      1,
      false,
      f.search,
      f.dept,
      f.filter,
      f.date,
      f.time,
      f.status,
      f.orderType,
    );

    setFromDashboardOnce(true);

    setInitialized(true);
  }, [route.params?.refreshKey]);

  useFocusEffect(
    useCallback(() => {
      if (!user || useLoading || !initialized) return;

      if (fromDashboardOnce) {
        setFromDashboardOnce(false);
        return;
      }

      fetchOrders(
        1,
        false,
        search,
        deptFilter,
        filter,
        dateFilter,
        timeFilter,
        statusFilter,
        orderTypeFilter,
      );
    }, [
      user,
      useLoading,
      initialized,
      filter,
      // search,
      deptFilter,
      dateFilter,
      timeFilter,
      statusFilter,
      orderTypeFilter,
      route.params?.fromDashboard,
    ]),
  );

  const debouncedCount = useCallback(
    debounce(() => {
      fetchPendingCount();
    }, 500),
    [
      search,
      deptFilter,
      filter,
      dateFilter,
      timeFilter,
      statusFilter,
      orderTypeFilter,
    ],
  );

  useEffect(() => {
    if (!user || useLoading || !initialized) return;
    debouncedCount();
  }, [
    search,
    deptFilter,
    filter,
    dateFilter,
    timeFilter,
    statusFilter,
    orderTypeFilter,
  ]);

  const debouncedSearch = useCallback(
    debounce((text) => {
      fetchOrders(
        1,
        false,
        text,
        deptFilter,
        filter,
        dateFilter,
        timeFilter,
        statusFilter,
        orderTypeFilter,
      );
    }, 500),
    [filter, dateFilter, deptFilter, timeFilter, statusFilter, orderTypeFilter],
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const getHighlightStyle = (color?: string) => {
    switch (color) {
      case "red":
        return {
          backgroundColor: "#fef2f2",
          borderColor: "#fecaca",
        };

      case "blue":
        return {
          backgroundColor: "#eff6ff",
          borderColor: "#bfdbfe",
        };

      case "yellow":
        return {
          backgroundColor: "#fffbeb",
          borderColor: "#fde68a",
        };

      default:
        return null;
    }
  };

  const onChangeSearch = (text: string) => {
    setSearch(text);
    debouncedSearch(text);
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (event.type === "dismissed") return;

    if (selectedDate) {
      const iso = selectedDate.toISOString().split("T")[0];

      setDateFilter(iso);

      fetchOrders(1, false, search, deptFilter, filter, iso);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(1);
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    await fetchOrders(page + 1, true);
  };

  const resetFilters = () => {
    setSearch("");
    setDateFilter(null);
    setDeptFilter("");
    setTimeFilter("");
    setStatusFilter([]);
    setOrderTypeFilter("");
  };

  const handleReset = () => {
    debouncedSearch.cancel();
    resetFilters();
    setShowFilters(false);
    setPage(1);
    fetchOrders(1, false, "", "", filter, null, "", [], "");
  };

  const onDragEnd = async ({ data }: any) => {
    setOrders(data);

    try {
      const ids = data.map((o: any) => Number(o.id));

      const user = await authService.getUser();

      if (!user) return;

      await orderService.updateOrderSort(user.id, ids);
    } catch (err) {
      console.log("Sort error:", err);
    }
  };

  const openDetail = (order: any) => {
    navigation.navigate("OrderDetail", { id: order.id });
  };

  const deptOptions = [
    { label: "Tất cả bộ phận", value: "" },
    ...departments.map((d: any) => ({
      label: d.name,
      value: d.id,
    })),
  ];

  const timeOptions = [
    { label: "Cả ngày", value: "" },
    { label: "Buổi sáng", value: "MORNING" },
    { label: "Buổi chiều", value: "AFTERNOON" },
  ];

  const timeFilterLabel =
    timeFilter === "MORNING"
      ? "Buổi sáng"
      : timeFilter === "AFTERNOON"
        ? "Buổi chiều"
        : "";

  const orderTypeOptions = [
    { label: "Tất cả", value: "" },
    { label: "Giao hồ sơ", value: "DELIVERY" },
    { label: "Nhận hồ sơ", value: "PICKUP" },
  ];

  const deptLabel =
    deptOptions.find((d) => d.value === deptFilter)?.label || "";

  const statusLabels = statuses
    .filter((s) => statusFilter.includes(s.value))
    .map((s) => s.label)
    .join(", ");

  const renderItem = ({ item, drag, isActive }: any) => {
    const highlight =
      user.role === "NVGN"
        ? getHighlightStyle(item.shipperHighlightColor)
        : null;
    const deliveryStatus = getDeliveryStatus(item.date, item.time, item.status);
    const deliveryStyle = getDeliveryStyle(item.date, item.time, item.status);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { borderLeftColor: getStatusBorderColor(item.status) },
          isSelected(item) && { borderWidth: 2, borderColor: "#2563eb" },
          highlight && {
            backgroundColor: highlight.backgroundColor,
            borderColor: highlight.borderColor,
          },
          isActive && styles.dragging,
        ]}
        onLongPress={canDrag ? drag : undefined}
        delayLongPress={canDrag ? 200 : 999999}
        onPress={() => openDetail(item)}
      >
        {isQL && (
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleSelect(item)}
          >
            <Ionicons
              name={isSelected(item) ? "checkbox" : "square-outline"}
              size={26}
              color={
                ["PENDING", "REJECTED"].includes(item.status)
                  ? "#2563eb"
                  : "#9ca3af"
              }
            />
          </TouchableOpacity>
        )}
        {item.priority === "HIGH" && (
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityText}>🔥 GẤP</Text>
          </View>
        )}
        {/* HEADER */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.orderCode, isQL && { marginLeft: 35 }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              #{item.orderCode || item.id}
            </Text>

            <Text
              style={[
                styles.department,
                getDeptTextColor(item.department?.code),
                isQL && { marginTop: 10 },
              ]}
            >
              {item.department?.name || "Không rõ bộ phận"}
            </Text>

            <View
              style={[styles.orderTypeBadge, getOrderTypeStyle(item.orderType)]}
            >
              <Text
                style={[
                  styles.orderTypeText,
                  getOrderTypeTextStyle(item.orderType),
                ]}
              >
                {getOrderTypeLabel(item.orderType)}
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, statusColor(item.status)]}>
            <Text style={[styles.statusText, statusTextColor(item.status)]}>
              {statusLabel(item.status)}
            </Text>
          </View>
        </View>

        {/* COMPANY */}
        <Text style={styles.company} numberOfLines={2}>
          {item.company}
        </Text>

        <View
          style={[
            styles.deliveryBox,
            {
              backgroundColor: deliveryStyle.bg,
              borderColor: deliveryStyle.bg,
            },
          ]}
        >
          <Ionicons name="time-outline" size={16} color={deliveryStyle.icon} />

          <Text style={[styles.deliveryText, { color: deliveryStyle.text }]}>
            {item.time || "Chưa có giờ"} •
            {item.date === new Date().toISOString().split("T")[0]
              ? " Hôm nay"
              : formatDate(item.date)}
            {deliveryStatus && (
              <Text style={{ color: deliveryStyle.text }}>
                {" "}
                • {deliveryStatus}
              </Text>
            )}
          </Text>
        </View>

        {/* ADDRESS */}
        <View style={styles.row}>
          <Ionicons name="location-outline" size={16} color="#6b7280" />
          <Text style={styles.address} numberOfLines={2}>
            {item.address}
          </Text>
        </View>

        {/* FOOTER */}
        <View style={styles.cardFooter}>
          <View style={styles.contactBox}>
            <Ionicons name="person-outline" size={14} color="#9ca3af" />

            <Text style={styles.receiverName} numberOfLines={2}>
              {item.contact || "Chưa có"}
            </Text>
          </View>

          {/* <Text style={styles.purpose} numberOfLines={2}>
            {item.purpose}
          </Text> */}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#6b7280" />

          <TextInput
            placeholder="Tìm mã đơn, khách hàng..."
            style={styles.searchInput}
            value={search}
            onChangeText={onChangeSearch}
          />
        </View>

        <TouchableOpacity
          onPress={() => fetchOrders(1)}
          style={styles.reloadBtn}
          disabled={loading}
        >
          <Ionicons
            name="refresh"
            size={18}
            color={loading ? "#ff0000" : "#ff4848"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters((prev) => !prev)}
        >
          <Ionicons name="filter-outline" size={20} color="#2563eb" />

          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterContainer}>
          {/* ROW 1 */}
          <View style={styles.filterRowSearch}>
            {/* Buổi */}
            <View style={styles.filterGroupTime}>
              <Text style={styles.filterLabel}>Buổi</Text>
              <View style={styles.filterItem3}>
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.dropdownPlaceholder}
                  selectedTextStyle={styles.dropdownText}
                  itemTextStyle={styles.dropdownItemText}
                  data={timeOptions}
                  labelField="label"
                  valueField="value"
                  placeholder="Chọn"
                  value={timeFilter}
                  onChange={(item) => setTimeFilter(item.value)}
                />
              </View>
            </View>

            {/* Loại */}
            <View style={styles.filterGroup3}>
              <Text style={styles.filterLabel}>Loại yêu cầu</Text>
              <View style={styles.filterItem3}>
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.dropdownPlaceholder}
                  selectedTextStyle={styles.dropdownText}
                  itemTextStyle={styles.dropdownItemText}
                  data={orderTypeOptions}
                  labelField="label"
                  valueField="value"
                  placeholder="Chọn"
                  value={orderTypeFilter}
                  onChange={(item) => setOrderTypeFilter(item.value)}
                />
              </View>
            </View>

            {/* Ngày */}
            <View style={styles.filterGroupIcon}>
              <Text style={styles.filterLabel}>Ngày giao</Text>
              <TouchableOpacity
                style={styles.filterItem3Icon}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#2563eb" />
                {dateFilter && <View style={styles.dot} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* ROW 2 */}
          <View style={styles.filterRowSearch}>
            {/* Bộ phận */}
            <View style={styles.filterGroup2}>
              <Text style={styles.filterLabel}>Bộ phận</Text>
              <View style={styles.filterItem2}>
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.dropdownPlaceholder}
                  selectedTextStyle={styles.dropdownText}
                  itemTextStyle={styles.dropdownItemText}
                  data={deptOptions}
                  labelField="label"
                  valueField="value"
                  placeholder="Chọn"
                  value={deptFilter}
                  onChange={(item) => setDeptFilter(item.value)}
                />
              </View>
            </View>

            {/* Trạng thái */}
            <View style={styles.filterGroup2}>
              <Text style={styles.filterLabel}>Trạng thái</Text>
              <TouchableOpacity
                style={styles.filterItem2}
                onPress={() => setShowStatusFilter(true)}
              >
                <Text style={styles.filterText}>
                  {statusFilter.length > 0
                    ? `Đã chọn (${statusFilter.length})`
                    : "Chọn"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={dateFilter ? new Date(dateFilter) : new Date()}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      {(search ||
        dateFilter ||
        deptFilter ||
        timeFilter ||
        statusFilter.length > 0 ||
        orderTypeFilter) && (
        <View style={styles.searchStatus}>
          <Text style={styles.searchStatusText}>
            Tìm kiếm:
            {search ? ` "${search}"` : ""}
            {dateFilter ? ` • ${formatDate(dateFilter)}` : ""}
            {deptFilter ? ` • ${deptLabel}` : ""}
            {timeFilter ? ` • ${timeFilterLabel}` : ""}
            {statusFilter.length > 0 ? ` • ${statusLabels}` : ""}
            {orderTypeFilter ? ` • ${getOrderTypeLabel(orderTypeFilter)}` : ""}
          </Text>

          {/* RIGHT ACTION */}
          <View style={styles.searchActions}>
            {/* RESET TEXT */}
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Đặt lại</Text>
            </TouchableOpacity>

            {/* CLOSE ICON */}
            <TouchableOpacity onPress={handleReset}>
              <Ionicons name="close-circle" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        style={{
          flexGrow: 0,
          height: 50,
        }}
      >
        {tabs.map((tab) => {
          if (!tab) return null;

          const isActive = filter === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setFilter(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>

              {tab.key === "PENDING_GROUP" && pendingOrdersCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {pendingOrdersCount > 99 ? "99+" : pendingOrdersCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isQL && pendingCount > 0 && (
        <View style={styles.selectAllWrapper}>
          <TouchableOpacity onPress={toggleAll} style={styles.selectAll}>
            <Ionicons
              name={isSelectAll ? "checkbox" : "square-outline"}
              size={22}
              color="#2563eb"
            />
            <Text>
              {isSelectAll
                ? `Đã chọn tất cả (${pendingCount - excludedOrders.length})`
                : `Chọn tất cả`}
            </Text>
          </TouchableOpacity>

          {/* 👉 Subtitle */}
          {isSelectAll && (
            <Text style={styles.selectAllSubtitle}>
              Chỉ chọn tất cả những đơn có trạng thái là "Chờ tiếp nhận" và "Từ
              chối"
            </Text>
          )}
        </View>
      )}

      {/* LIST */}
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : (
        <View style={{ flex: 1 }}>
          <DraggableFlatList
            data={orders}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            onDragEnd={onDragEnd}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            // activationDistance={20}
            scrollEnabled={true}
            activationDistance={10}
            dragItemOverflow={true}
            autoscrollThreshold={50}
            autoscrollSpeed={50}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#2563eb"]}
              />
            }
            ListEmptyComponent={() => {
              if (loading) return null;

              const filters = [
                search,
                dateFilter,
                deptFilter,
                timeFilter,
                orderTypeFilter,
                statusFilter,
              ];

              const isFiltering = filters.some((f) => {
                if (Array.isArray(f)) return f.length > 0;
                return !!f;
              });

              if (isFiltering) {
                return <EmptyState type="search" />;
              } else if (filter === "TODAY" && user?.role === "NVGN") {
                return (
                  <EmptyState type="today" onAction={() => setFilter("ALL")} />
                );
              } else {
                return <EmptyState />;
              }
            }}
            ListFooterComponent={() => {
              if (loadingMore) {
                return (
                  <View style={styles.footer}>
                    <ActivityIndicator size="small" color="#2563eb" />
                    <Text style={styles.footerText}>Đang tải thêm...</Text>
                  </View>
                );
              }

              if (!hasMore && orders.length > 0) {
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
            contentContainerStyle={{ paddingBottom: tabHeight + 60 }}
          />
        </View>
      )}

      {isQL && getSelectedCount() > 0 && (
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => setShowAssignModal(true)}
        >
          <Text style={styles.assignText}>
            Phân công ({getSelectedCount()})
          </Text>
        </TouchableOpacity>
      )}

      <Modal visible={showAssignModal} transparent animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAssignModal(false)}
        >
          <Pressable
            style={styles.modalBox}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Chọn nhân viên giao nhận</Text>

            <Text style={styles.selectedInfo}>
              Đã chọn {getSelectedCount()} đơn
            </Text>

            <Dropdown
              style={styles.dropdownShipper}
              containerStyle={styles.dropdownContainerShipper}
              dropdownPosition="top"
              maxHeight={250}
              placeholderStyle={styles.dropdownPlaceholderShipper}
              selectedTextStyle={styles.dropdownSelected}
              data={shipperOptions}
              labelField="label"
              valueField="value"
              placeholder="Chọn nhân viên giao nhận"
              value={selectedShipper?.value}
              onChange={(item) => setSelectedShipper(item)}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={confirmBulkAssign}
              >
                <Text style={styles.applyText}>
                  Xác nhận ({getSelectedCount()})
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showStatusFilter} animationType="slide" transparent>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowStatusFilter(false)}
        >
          <Pressable
            style={styles.statusModal}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Lọc trạng thái</Text>

            <ScrollView>
              {statuses.map((s) => {
                const checked = statusFilter.includes(s.value);

                return (
                  <TouchableOpacity
                    key={s.value}
                    style={styles.statusItem}
                    onPress={() => {
                      if (checked) {
                        setStatusFilter(
                          statusFilter.filter((x) => x !== s.value),
                        );
                      } else {
                        setStatusFilter([...statusFilter, s.value]);
                      }
                    }}
                  >
                    <View
                      style={[styles.statusDot, { backgroundColor: s.color }]}
                    />

                    <Text style={styles.statusLabel}>{s.label}</Text>

                    {checked && (
                      <Ionicons name="checkmark" size={18} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setShowStatusFilter(false);
                  setStatusFilter([]);
                }}
              >
                <Text style={styles.clearText}>Xóa tất cả</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
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
    marginTop: 15,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
  },

  // tabs: {
  //   flexDirection: "row",
  //   paddingHorizontal: 12,
  //   marginBottom: 12,
  //   gap: 10,
  //   justifyContent: "flex-start",
  // },

  tabs: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 10,
    alignItems: "center",
    flexShrink: 0,
  },

  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: "#f3f4f6",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    flexShrink: 0,
  },

  tabActive: {
    backgroundColor: "#2563eb",
    shadowColor: "#2563eb",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    transform: [{ scale: 1.05 }],
  },

  tabText: {
    color: "#374151",
    fontWeight: "500",
    fontSize: 14,
  },

  tabTextActive: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },

  card: {
    backgroundColor: "white",
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 14,
    borderRadius: 10,

    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  department: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 2,
  },

  dragging: {
    backgroundColor: "#eef2ff",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  orderCode: {
    fontWeight: "700",
    fontSize: 15,
    color: "#0343c4",
  },

  company: {
    fontSize: 14,
    marginBottom: 6,
    color: "#111827",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  address: {
    color: "#6b7280",
    fontSize: 12,
    flex: 1,
  },

  cardFooter: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  contactBox: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 4,
  },

  receiverName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    flex: 1,
  },

  purpose: {
    fontSize: 12,
    color: "#ef4444",
    flex: 1,
    textAlign: "right",
  },

  statusBadge: {
    minWidth: 70,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
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

  footer: {
    paddingVertical: 20,
    paddingBottom: 60,
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

  remaining: {
    color: "#dc2626",
    fontWeight: "600",
  },

  searchRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 10,
  },

  dateButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#eff6ff",
  },

  clearDate: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 6,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },

  emptyText: {
    fontSize: 13,
    color: "#9ca3af",
  },

  deptPicker: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    color: "#374151",
  },

  deptFilterActive: {
    borderColor: "#2563eb",
    shadowColor: "#2563eb",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  dropdown: {
    flex: 1,
    marginLeft: 10,
  },

  dropdownContainer: {
    borderRadius: 10,
    width: "40%",
    marginLeft: -40,
  },

  dropdownPlaceholder: {
    fontSize: 13,
    color: "#9ca3af",
  },

  dropdownText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },

  dropdownItemText: {
    fontSize: 13,
  },

  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  timeFilter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    height: 42,
  },

  deptFilter: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    height: 42,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  statusModal: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },

  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },

  statusLabel: {
    flex: 1,
    fontSize: 15,
  },

  applyText: {
    color: "white",
    fontWeight: "600",
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  clearButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ef4444",
    marginRight: 10,
    alignItems: "center",
  },

  clearText: {
    color: "#ef4444",
    fontWeight: "600",
  },

  applyButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  orderTypeBadge: {
    marginTop: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },

  orderTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  timeFilterSmall: {
    width: 100, // nhỏ lại
    marginLeft: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 8,
    height: 42,
  },

  searchStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    marginBottom: 6,
  },

  searchStatusText: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
    flex: 1,
  },

  searchActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 10,
  },

  resetText: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "600",
  },

  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  filterBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },

  filterRowSearch: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  filterItem3: {
    width: "100%",
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  filterItem2: {
    width: "100%",
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  filterText: {
    fontSize: 13,
    color: "#374151",
  },

  filterItem3Icon: {
    width: "100%",
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  dot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
  },

  filterLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },

  filterGroup3: {
    width: "40%",
  },

  filterGroup2: {
    width: "48%",
  },

  filterGroupTime: {
    width: "37%",
  },

  filterGroupIcon: {
    width: "15%",
    alignItems: "center",
  },

  priorityBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "#dc2626",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderBottomRightRadius: 8,
    zIndex: 10,

    shadowColor: "#dc2626",
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },

  priorityText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  checkbox: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  assignButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
  assignText: {
    color: "white",
    fontWeight: "bold",
  },

  modalBox: {
    width: "100%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingBottom: 50,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },

  shipperItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dropdownShipper: {
    height: 48,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 6,
    marginBottom: 12,
    backgroundColor: "white",
  },

  dropdownContainerShipper: {
    // borderRadius: 10,
    borderRadius: 10,
    elevation: 10,
    zIndex: 9999,
  },

  dropdownPlaceholderShipper: {
    color: "#9ca3af",
    fontSize: 14,
  },

  dropdownSelected: {
    color: "#111827",
    fontWeight: "500",
    fontSize: 14,
  },

  selectAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  selectAllWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: "#f8fafc",
  },

  selectedInfo: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 13,
    color: "#6b7280",
  },

  selectAllSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#6b7280",
  },

  selectAllActive: {
    backgroundColor: "#eff6ff",
  },

  reloadBtn: {
    marginLeft: 6,
    padding: 4,
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#ffcccc",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
});
