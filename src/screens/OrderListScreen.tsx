import React, { useEffect, useState, useCallback, use, useRef } from "react";
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
import { connectSocket, disconnectSocket } from "../services/socket.service";
import { LinearGradient } from "expo-linear-gradient";

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
  const isQL = user?.role === "QL" || user?.role === "SUPERADMIN";

  const isMyOrder = filter === "MY_ORDERS_TODAY" || filter === "MY_ORDERS_ALL";

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

  const filterRef = useRef({
    search: "",
    deptFilter: "",
    filter: "ALL",
    dateFilter: null as string | null,
    timeFilter: "",
    statusFilter: [] as string[],
    orderTypeFilter: "",
  });

  useEffect(() => {
    filterRef.current = {
      search,
      deptFilter,
      filter,
      dateFilter,
      timeFilter,
      statusFilter,
      orderTypeFilter,
    };
  }, [
    search,
    deptFilter,
    filter,
    dateFilter,
    timeFilter,
    statusFilter,
    orderTypeFilter,
  ]);

  useEffect(() => {
    if (!user) return;

    connectSocket(user.id, user.role, {
      dashboardUpdate: () => {
        console.log("📡 dashboardUpdate");
        const currentFilter = filterRef.current;
        fetchOrders(
          1,
          false,
          currentFilter.search,
          currentFilter.deptFilter,
          currentFilter.filter,
          currentFilter.dateFilter,
          currentFilter.timeFilter,
          currentFilter.statusFilter,
          currentFilter.orderTypeFilter,
        );
      },
    });
  }, [user]);

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
    if (user?.role === "QL" || user?.role === "SUPERADMIN") {
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
    // dateFilter,
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
    "ARISING",
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
    { value: "SUPPLEMENT_REQUIRED", label: "Phát sinh", color: "#c2410c" },
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
      { key: "TODAY", label: "Giao nhận hôm nay" },
      { key: "PENDING_GROUP", label: "Cần xử lý" },
      { key: "DONE_GROUP", label: "Hoàn tất" },
      { key: "MY_ORDERS_TODAY", label: "Đơn của tôi hôm nay" },
      { key: "MY_ORDERS_ALL", label: "Đơn của tôi" },
    ];

    if (user?.role === "NVGN") {
      return [
        baseTabs.find((t) => t.key === "TODAY"),
        baseTabs.find((t) => t.key === "ALL"),
        baseTabs.find((t) => t.key === "PENDING_GROUP"),
        baseTabs.find((t) => t.key === "DONE_GROUP"),
      ].filter(Boolean);
    }

    if (user?.role === "QL") {
      return [
        baseTabs.find((t) => t.key === "ALL"),
        baseTabs.find((t) => t.key === "TODAY"),
        baseTabs.find((t) => t.key === "PENDING_GROUP"),
        baseTabs.find((t) => t.key === "MY_ORDERS_TODAY"),
        baseTabs.find((t) => t.key === "MY_ORDERS_ALL"),
        baseTabs.find((t) => t.key === "DONE_GROUP"),
      ].filter(Boolean);
    }

    if (user?.role === "SUPERADMIN" || user?.role === "NVADMIN") {
      return [
        baseTabs.find((t) => t.key === "ALL"),
        baseTabs.find((t) => t.key === "TODAY"),
        baseTabs.find((t) => t.key === "PENDING_GROUP"),
        baseTabs.find((t) => t.key === "DONE_GROUP"),
      ].filter(Boolean);
    }

    return baseTabs;
  }, [user]);

  // const buildFiltersFromParams = (params: any) => {
  //   const hasOnlyFilter =
  //     params?.filter &&
  //     !params?.status &&
  //     !params?.dept &&
  //     !params?.date &&
  //     !params?.time &&
  //     !params?.orderType;

  //   if (hasOnlyFilter) {
  //     return {
  //       search: "",
  //       dept: "",
  //       date: null,
  //       time: "",
  //       orderType: "",
  //       filter: params.filter,
  //       status: [],
  //     };
  //   }

  //   return {
  //     search: "",
  //     dept: params?.dept || "",
  //     date: params?.date || null,
  //     time: params?.time || "",
  //     orderType: params?.orderType || "",
  //     filter: params?.filter || "ALL",
  //     status: Array.isArray(params?.status)
  //       ? params.status
  //       : params?.status
  //         ? [params.status]
  //         : [],
  //   };
  // };

  useEffect(() => {
    if (!user) return;

    const newFilter = user.role === "NVGN" ? "TODAY" : "ALL";

    setFilter(newFilter);
    setInitialized(true);
  }, [user]);

  // useEffect(() => {
  //   if (!route.params?.fromDashboard) return;

  //   const f = buildFiltersFromParams(route.params);

  //   setSearch(f.search);
  //   setDeptFilter(f.dept);
  //   setDateFilter(f.date);
  //   setTimeFilter(f.time);
  //   setOrderTypeFilter(f.orderType);
  //   setFilter(f.filter);
  //   setStatusFilter(f.status);

  //   fetchOrders(
  //     1,
  //     false,
  //     f.search,
  //     f.dept,
  //     f.filter,
  //     f.date,
  //     f.time,
  //     f.status,
  //     f.orderType,
  //   );

  //   setFromDashboardOnce(true);

  //   setInitialized(true);
  // }, [route.params?.refreshKey]);

  useEffect(() => {
    if (!user || useLoading || !initialized) return;
    if (fromDashboardOnce) return;

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
    filter,
    statusFilter,
    deptFilter,
    dateFilter,
    timeFilter,
    orderTypeFilter,
    user,
    useLoading,
    initialized,
    fromDashboardOnce,
  ]);

  useEffect(() => {
    if (!route.params?.fromDashboard || !route.params?.refreshKey) return;

    const f = buildFiltersFromParams(route.params);

    setSearch(f.search);
    setDeptFilter(f.dept);
    setDateFilter(f.date);
    setTimeFilter(f.time);
    setOrderTypeFilter(f.orderType);
    setFilter(f.filter);
    setStatusFilter(f.status);

    setPage(1);
    resetSelection();

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
  }, [route.params?.refreshKey, route.params?.fromDashboard]); // Thêm dependency

  const searchRef = useRef(search);

  const buildFiltersFromParams = (params: any) => {
    if (!params?.fromDashboard) {
      return {
        search: "",
        dept: "",
        date: null,
        time: "",
        orderType: "",
        filter: user?.role === "NVGN" ? "TODAY" : "ALL",
        status: [],
      };
    }

    if (params?.status && Array.isArray(params.status)) {
      return {
        search: "",
        dept: "",
        date: null,
        time: "",
        orderType: "",
        filter: params.filter || "ALL",
        status: params.status,
      };
    }

    return {
      search: "",
      dept: params?.dept || "",
      date: params?.date || null,
      time: params?.time || "",
      orderType: params?.orderType || "",
      filter: params?.filter || "ALL",
      status: params?.status ? [params.status] : [],
    };
  };

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      if (!user || useLoading || !initialized) return;

      if (fromDashboardOnce) {
        setFromDashboardOnce(false);
        return;
      }

      if (route.params?.fromDashboard) return;

      fetchOrders(
        1,
        false,
        searchRef.current,
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
      deptFilter,
      dateFilter,
      timeFilter,
      statusFilter,
      orderTypeFilter,
      route.params?.fromDashboard,
    ]),
  );

  // useFocusEffect(
  //   useCallback(() => {
  //     if (!user || useLoading || !initialized) return;

  //     if (fromDashboardOnce) {
  //       setFromDashboardOnce(false);
  //       return;
  //     }

  //     fetchOrders(
  //       1,
  //       false,
  //       searchRef.current,
  //       deptFilter,
  //       filter,
  //       dateFilter,
  //       timeFilter,
  //       statusFilter,
  //       orderTypeFilter,
  //     );
  //   }, [
  //     user,
  //     useLoading,
  //     initialized,
  //     filter,
  //     // search,
  //     deptFilter,
  //     dateFilter,
  //     timeFilter,
  //     statusFilter,
  //     orderTypeFilter,
  //     route.params?.fromDashboard,
  //   ]),
  // );

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
          isSelected(item) && { borderWidth: 1.5, borderColor: "#2563eb" },
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
        {isQL && !isMyOrder && (
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleSelect(item)}
          >
            <Ionicons
              name={isSelected(item) ? "checkbox" : "square-outline"}
              size={20}
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
              style={[
                styles.orderCode,
                isQL && !isMyOrder && { marginLeft: 28 },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              #{item.orderCode || item.id}
            </Text>

            <Text
              style={[
                styles.department,
                getDeptTextColor(item.department?.code),
                isQL && { marginTop: 6 },
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
              backgroundColor: item.timeSlot ? "#EFF6FF" : deliveryStyle.bg, // xanh dương nhạt nếu có timeSlot
              borderColor: item.timeSlot ? "#BFDBFE" : deliveryStyle.bg, // border xanh dương nếu có timeSlot
            },
          ]}
        >
          <Ionicons
            name="time-outline"
            size={12}
            color={item.timeSlot ? "#3B82F6" : deliveryStyle.icon} // icon xanh dương nếu có timeSlot
          />

          <Text
            style={[
              styles.deliveryText,
              {
                color: item.timeSlot ? "#1D4ED8" : deliveryStyle.text, // text xanh dương đậm nếu có timeSlot
              },
            ]}
          >
            {item.timeSlot
              ? item.timeSlot === "MORNING"
                ? "Buổi sáng"
                : "Buổi chiều"
              : item.time || "Chưa có giờ"}{" "}
            •
            {item.date === new Date().toISOString().split("T")[0]
              ? " Hôm nay"
              : formatDate(item.date)}
            {!item.timeSlot && deliveryStatus && (
              <Text style={{ color: deliveryStyle.text }}>
                {" "}
                • {deliveryStatus}
              </Text>
            )}
          </Text>
        </View>

        {/* ADDRESS */}
        <View style={styles.row}>
          <Ionicons name="location-outline" size={12} color="#6b7280" />
          <Text style={styles.address} numberOfLines={2}>
            {item.addressNew ||item.address || "Không có địa chỉ"}
          </Text>
        </View>

        <View style={styles.rowContact}>
          <Ionicons name="person-outline" size={12} color="#6b7280" />
          <Text style={styles.address} numberOfLines={2}>
            {item.contactNew || item.contact || "Không có người liên hệ"}{" "}
            {item.phoneNew || item.phone ? ` - ${item.phone}` : ""}
          </Text>
        </View>

        {/* FOOTER */}
        <View style={styles.cardFooter}>
          <View style={styles.contactBox}>
            <Ionicons name="bicycle-outline" size={11} color="#9ca3af" />

            <Text style={styles.receiverName} numberOfLines={2}>
              {item.receiverName || "Chưa phân công"}
            </Text>
          </View>

          <Text style={styles.purpose} numberOfLines={2}>
            {item.purpose}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={14} color="#6b7280" />

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
            size={14}
            color={loading ? "#ff0000" : "#ff4848"}
          />
        </TouchableOpacity>

        {/* Ngày */}
        <View style={styles.btnDateFilter}>
          <TouchableOpacity
            style={styles.filterItem3Icon}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={14} color="#2563eb" />
            {dateFilter && <View style={styles.dot} />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters((prev) => !prev)}
        >
          <Ionicons name="filter-outline" size={16} color="#2563eb" />

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
            <View style={styles.filterGroup2}>
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
            <View style={styles.filterGroup2}>
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
            {dateFilter ? ` • Ngày giao nhận: ${formatDate(dateFilter)}` : ""}
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
              <Ionicons name="close-circle" size={14} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        style={{
          flexGrow: 0,
          height: 40,
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

              {/* {tab.key === "PENDING_GROUP" && pendingOrdersCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {pendingOrdersCount > 99 ? "99+" : pendingOrdersCount}
                  </Text>
                </View>
              )} 
            </TouchableOpacity>
          );
        })}
      </ScrollView> */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        style={{
          flexGrow: 0,
          height: 40,
        }}
      >
        {tabs.map((tab) => {
          if (!tab) return null;

          const isActive = filter === tab.key;

          const getTabStyle = () => {
            const baseStyle = {
              backgroundColor: "#F3F4F6",
              borderWidth: 1,
              borderColor: "#E5E7EB",
            };
            const activeStyle = {
              borderWidth: 0,
              shadowColor: "transparent",
              elevation: 0,
            };

            switch (tab.key) {
              case "ALL":
                return isActive
                  ? { ...activeStyle, backgroundColor: "#7C3AED" }
                  : {
                      ...baseStyle,
                      backgroundColor: "#F5F3FF",
                      borderColor: "#DDD6FE",
                    };
              case "TODAY":
                return isActive
                  ? { ...activeStyle, backgroundColor: "#2563EB" }
                  : {
                      ...baseStyle,
                      backgroundColor: "#EFF6FF",
                      borderColor: "#BFDBFE",
                    };
              case "PENDING_GROUP":
                return isActive
                  ? { ...activeStyle, backgroundColor: "#EA580C" }
                  : {
                      ...baseStyle,
                      backgroundColor: "#FFF7ED",
                      borderColor: "#FED7AA",
                    };
              case "DONE_GROUP":
                return isActive
                  ? { ...activeStyle, backgroundColor: "#059669" }
                  : {
                      ...baseStyle,
                      backgroundColor: "#ECFDF5",
                      borderColor: "#A7F3D0",
                    };
              case "MY_ORDERS_TODAY":
                return isActive
                  ? { ...activeStyle, backgroundColor: "#0891B2" }
                  : {
                      ...baseStyle,
                      backgroundColor: "#F0FDFA",
                      borderColor: "#99F6E4",
                    };
              case "MY_ORDERS_ALL":
                return isActive
                  ? { ...activeStyle, backgroundColor: "#D97706" } // Vàng nâu đậm
                  : {
                      ...baseStyle,
                      backgroundColor: "#FFFBEB",
                      borderColor: "#FDE68A",
                    };
              default:
                return baseStyle;
            }
          };

          const getTabTextStyle = () => {
            if (isActive) return styles.tabTextActive;
            switch (tab.key) {
              case "ALL":
                return { color: "#6D28D9" };
              case "TODAY":
                return { color: "#1D4ED8" };
              case "PENDING_GROUP":
                return { color: "#C2410C" };
              case "DONE_GROUP":
                return { color: "#047857" };
              case "MY_ORDERS_TODAY":
                return { color: "#0E7490" };
              case "MY_ORDERS_ALL":
                return { color: "#B45309" };
              default:
                return { color: "#374151" };
            }
          };

          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                getTabStyle(),
                // isActive && styles.tabActive,
              ]}
              onPress={() => setFilter(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, getTabTextStyle()]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isQL && !isMyOrder && pendingCount > 0 && (
        <View style={styles.selectAllWrapper}>
          <TouchableOpacity onPress={toggleAll} style={styles.selectAll}>
            <Ionicons
              name={isSelectAll ? "checkbox" : "square-outline"}
              size={18}
              color="#2563eb"
            />
            <Text style={styles.selectAllText}>
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
              } else if (filter === "TODAY" || filter === "MY_ORDERS_TODAY") {
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

      {/* {isQL && getSelectedCount() > 0 && (
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => setShowAssignModal(true)}
        >
          <Text style={styles.assignText}>
            Phân công ({getSelectedCount()})
          </Text>
        </TouchableOpacity>
      )} */}
      {isQL && getSelectedCount() > 0 ? (
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => setShowAssignModal(true)}
        >
          <Text style={styles.assignText}>
            Phân công ({getSelectedCount()})
          </Text>
        </TouchableOpacity>
      ) : (
        (user?.role === "NVADMIN" || user?.role === "SUPERADMIN") && (
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: "#22C55E",
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
            onPress={() => navigation.navigate("OrderForm")}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )
      )}

      <Modal visible={showAssignModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAssignModal(false)}
        >
          <Pressable
            style={styles.modalBox}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <LinearGradient
                  colors={["#3B82F6", "#2563EB"]}
                  style={styles.modalHeaderIcon}
                >
                  <Ionicons
                    name="swap-horizontal-outline"
                    size={20}
                    color="#FFFFFF"
                  />
                </LinearGradient>
                <View>
                  <Text style={styles.modalTitle}>Phân công hàng loạt</Text>
                  <Text style={styles.selectedInfo}>
                    Đã chọn {getSelectedCount()} đơn hàng
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Dropdown Section */}
            <View style={styles.modalSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people-outline" size={16} color="#64748B" />
                <Text style={styles.sectionLabel}>
                  Chọn nhân viên giao nhận
                </Text>
              </View>

              <Dropdown
                style={styles.dropdownShipper}
                containerStyle={styles.dropdownContainerShipper}
                itemContainerStyle={styles.dropdownItemContainer}
                dropdownPosition="top"
                maxHeight={250}
                data={shipperOptions}
                labelField="name"
                valueField="value"
                placeholder="Chọn nhân viên giao nhận"
                placeholderStyle={styles.dropdownPlaceholderShipper}
                selectedTextStyle={styles.dropdownSelectedShipper}
                value={selectedShipper?.value}
                onChange={(item) => setSelectedShipper(item)}
                renderLeftIcon={() => (
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={selectedShipper?.value ? "#3B82F6" : "#94A3B8"}
                    style={{ marginRight: 8 }}
                  />
                )}
                renderItem={(item) => (
                  <View style={styles.itemRow}>
                    <View style={styles.itemLeft}>
                      <View>
                        <Text style={styles.itemName}>{item.name}</Text>
                      </View>
                    </View>

                    <View style={styles.itemRight}>
                      {item.activeOrders > 0 ? (
                        <View style={styles.busyBadge}>
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: "#EF4444" },
                            ]}
                          />
                          <Text style={styles.busyText}>
                            {item.activeOrders} đơn
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.freeBadge}>
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: "#22C55E" },
                            ]}
                          />
                          <Text style={styles.freeText}>Rảnh</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              />
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAssignModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Đóng</Text>
              </TouchableOpacity>

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
                      <Ionicons name="checkmark" size={14} color="#2563eb" />
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
    marginTop: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 12,
    marginLeft: 6,
  },

  tabs: {
    flexDirection: "row",
    paddingHorizontal: 10,
    gap: 8,
    alignItems: "center",
    flexShrink: 0,
  },

  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    // backgroundColor: "#f3f4f6",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    flexShrink: 0,
  },

  tabActive: {
    // backgroundColor: "#2563eb",
    // shadowColor: "#2563eb",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    transform: [{ scale: 1.05 }],
  },

  tabText: {
    // color: "#374151",
    fontWeight: "500",
    fontSize: 12,
  },

  tabTextActive: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },

  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "600",
  },

  card: {
    backgroundColor: "white",
    marginHorizontal: 10,
    marginVertical: 4,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  department: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 1,
  },

  dragging: {
    backgroundColor: "#eef2ff",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  orderCode: {
    fontWeight: "700",
    fontSize: 13,
    color: "#0343c4",
  },

  company: {
    fontSize: 12,
    marginBottom: 4,
    color: "#111827",
    fontWeight: "600",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  rowContact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },

  address: {
    color: "#6b7280",
    fontSize: 11,
    flex: 1,
  },

  cardFooter: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  contactBox: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 3,
  },

  receiverName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
    flex: 1,
  },

  purpose: {
    fontSize: 11,
    color: "#ef4444",
    flex: 1,
    textAlign: "right",
  },

  statusBadge: {
    minWidth: 60,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },

  deliveryBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 5,
    alignSelf: "flex-start",
    marginBottom: 4,
    gap: 4,
    borderWidth: 1,
  },

  deliveryText: {
    fontSize: 11,
    fontWeight: "700",
  },

  footer: {
    paddingVertical: 16,
    paddingBottom: 50,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  footerText: {
    fontSize: 11,
    color: "#6b7280",
  },

  footerDone: {
    fontSize: 11,
    color: "#9ca3af",
    fontStyle: "italic",
  },

  remaining: {
    color: "#dc2626",
    fontWeight: "600",
  },

  searchRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },

  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 36,
  },

  dateButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#eff6ff",
  },

  clearDate: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 4,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },

  emptyText: {
    fontSize: 11,
    color: "#9ca3af",
  },

  deptPicker: {
    flex: 1,
    marginLeft: 4,
    fontSize: 11,
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
    marginLeft: 6,
  },

  dropdownContainer: {
    borderRadius: 8,
    width: "40%",
    marginLeft: -30,
  },

  dropdownPlaceholder: {
    fontSize: 11,
    color: "#9ca3af",
  },

  dropdownText: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "500",
  },

  dropdownItemText: {
    fontSize: 11,
  },

  filterRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },

  timeFilter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    height: 34,
  },

  deptFilter: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    height: 34,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  statusModal: {
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: "70%",
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },

  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  statusLabel: {
    flex: 1,
    fontSize: 13,
  },

  applyText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    // marginTop: 12,
    gap: 9,
  },

  clearButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef4444",
    marginRight: 8,
    alignItems: "center",
  },

  clearText: {
    color: "#ef4444",
    fontWeight: "600",
    fontSize: 13,
  },

  applyButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  orderTypeBadge: {
    marginTop: 3,
    alignSelf: "flex-start",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
  },

  orderTypeText: {
    fontSize: 10,
    fontWeight: "600",
  },

  timeFilterSmall: {
    width: 80,
    marginLeft: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 6,
    height: 34,
  },

  searchStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 4,
  },

  searchStatusText: {
    fontSize: 11,
    color: "#6b7280",
    fontStyle: "italic",
    flex: 1,
  },

  searchActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },

  resetText: {
    fontSize: 11,
    color: "#ef4444",
    fontWeight: "600",
  },

  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  filterBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },

  filterBadgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "700",
  },

  filterContainer: {
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 8,
  },

  filterRowSearch: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  filterItem3: {
    width: "100%",
    height: 36,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  filterItem2: {
    width: "100%",
    height: 36,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  filterText: {
    fontSize: 11,
    color: "#374151",
  },

  filterItem3Icon: {
    width: "100%",
    height: 34,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  dot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#ef4444",
  },

  filterLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 3,
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
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderBottomRightRadius: 6,
    zIndex: 10,
    shadowColor: "#dc2626",
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },

  priorityText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },

  checkbox: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  assignButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },

  assignText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 13,
  },

  modalBox: {
    width: "100%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingBottom: 40,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },

  shipperItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dropdownShipper: {
    height: 40,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 4,
    marginBottom: 10,
    backgroundColor: "white",
  },

  dropdownContainerShipper: {
    borderRadius: 8,
    elevation: 10,
    zIndex: 9999,
  },

  dropdownPlaceholderShipper: {
    color: "#9ca3af",
    fontSize: 12,
  },

  dropdownSelected: {
    color: "#111827",
    fontWeight: "500",
    fontSize: 12,
  },

  selectAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  selectAllWrapper: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: "#f8fafc",
  },

  selectAllText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },

  selectedInfo: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 11,
    color: "#6b7280",
  },

  selectAllSubtitle: {
    marginTop: 2,
    fontSize: 10,
    color: "#6b7280",
  },

  selectAllActive: {
    backgroundColor: "#eff6ff",
  },

  reloadBtn: {
    marginLeft: 4,
    padding: 4,
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#ffcccc",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  btnDateFilter: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#cce5ff",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  // modalBox: {
  //   backgroundColor: "#FFFFFF",
  //   borderTopLeftRadius: 24,
  //   borderTopRightRadius: 24,
  //   padding: 20,
  //   maxHeight: "80%",
  //   shadowColor: "#000",
  //   shadowOffset: { width: 0, height: -10 },
  //   shadowOpacity: 0.15,
  //   shadowRadius: 30,
  //   elevation: 20,
  // },

  // Modal Header
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },

  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 12,
  },

  modalHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  // modalTitle: {
  //   fontSize: 18,
  //   fontWeight: "700",
  //   color: "#1E293B",
  //   marginBottom: 4,
  // },

  // selectedInfo: {
  //   fontSize: 13,
  //   color: "#3B82F6",
  //   fontWeight: "600",
  // },

  // Modal Section
  modalSection: {
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },

  // Dropdown Shipper
  // dropdownShipper: {
  //   borderWidth: 1,
  //   borderColor: "#E2E8F0",
  //   borderRadius: 10,
  //   paddingHorizontal: 12,
  //   height: 46,
  //   backgroundColor: "#F8FAFC",
  // },

  // dropdownContainerShipper: {
  //   borderRadius: 12,
  //   borderWidth: 1,
  //   borderColor: "#E2E8F0",
  //   marginTop: 4,
  //   shadowColor: "#000",
  //   shadowOffset: { width: 0, height: 4 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 12,
  //   elevation: 8,
  // },

  dropdownItemContainer: {
    borderRadius: 8,
  },

  // dropdownPlaceholderShipper: {
  //   fontSize: 13,
  //   color: "#94A3B8",
  // },

  dropdownSelectedShipper: {
    fontSize: 13,
    color: "#1E293B",
    fontWeight: "500",
  },

  // Dropdown Item (đồng bộ với ReassignOrderScreen)
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

  // statusDot: {
  //   width: 6,
  //   height: 6,
  //   borderRadius: 3,
  // },

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

  // Modal Actions
  // modalActions: {
  //   flexDirection: "row",
  //   gap: 10,
  // },

  modalCancelBtn: {
    flex: 1,
    // height: 46,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },

  // applyButton: {
  //   flex: 2,
  //   borderRadius: 12,
  //   overflow: "hidden",
  //   shadowColor: "#3B82F6",
  //   shadowOffset: { width: 0, height: 3 },
  //   shadowOpacity: 0.3,
  //   shadowRadius: 6,
  //   elevation: 4,
  // },

  applyButtonDisabled: {
    opacity: 0.6,
    shadowColor: "#94A3B8",
  },

  applyGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 6,
  },

  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
