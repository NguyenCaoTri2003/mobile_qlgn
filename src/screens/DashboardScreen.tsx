import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

import useDashboardStats from "../hooks/useDashboardStats";
import StatCard from "../components/dashboard/StatCard";
import { DeptBar } from "../components/dashboard/DeptBar";
import Skeleton from "../components/Skeleton";
import { useAuth } from "../contexts/AuthContext";
import useTodayOrders from "../hooks/useTodayOrders";
import TodayOrdersCard from "../components/dashboard/TodayOrdersCard";
import DateTimePicker from "@react-native-community/datetimepicker";
import useShipperStats from "../hooks/useShipperStats";
import { Ionicons } from "@expo/vector-icons";
import { settingService } from "../services/setting.service";

const { width, height } = Dimensions.get("window");

export default function DashboardScreen({ navigation }: any) {
  const {
    stats,
    loading,
    refresh,

    range,
    setRange,
    selectedDate,
    setSelectedDate,
    selectedMonth,
    setSelectedMonth,
    selectedQuarter,
    setSelectedQuarter,
    selectedYear,
    setSelectedYear,
  } = useDashboardStats();

  const {
    shipperStats,
    loading: shipperLoading,
    fetchStats,
  } = useShipperStats();

  const { user } = useAuth();

  const {
    orders: todayOrders,
    loading: todayLoading,
    refresh: refreshToday,
  } = useTodayOrders();

  const isNVGN = user?.role === "NVGN";
  const [showPicker, setShowPicker] = useState(false);

  const [tooltip, setTooltip] = useState<{
    index: number;
    type: string;
  } | null>(null);

  const currentTimeRef = useRef(new Date());

  const getGreeting = () => {
    const hour = currentTimeRef.current.getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  const getGreetingIcon = () => {
    const hour = currentTimeRef.current.getHours();
    if (hour < 12) return "sunny-outline";
    if (hour < 18) return "partly-sunny-outline";
    return "moon-outline";
  };

  const buildParams = () => {
    return {
      range,
      date: selectedDate,
      month: selectedMonth,
      quarter: selectedQuarter,
      year: selectedYear,
    };
  };

  const [showDemoButton, setShowDemoButton] = useState(false);

  const parseDate = (str: string) => new Date(str);

  const toMonthString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  };

  const toDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    const [y, m, d] = date.split("-");
    return `${d}/${m}/${y}`;
  };

  const formatMonth = (month: string) => {
    if (!month) return "";
    const [y, m] = month.split("-");
    return `${m}/${y}`;
  };

  const resetFilter = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");

    setRange("day");
    setSelectedDate(`${y}-${m}-${d}`);
    setSelectedMonth(`${y}-${m}`);
    setSelectedQuarter(Math.floor(now.getMonth() / 3) + 1);
    setSelectedYear(y);
  };

  const loadSettings = async () => {
    try {
      const res = await settingService.getSystemSettingsApi();

      const showDemo = res?.data?.show_demo_lookup === "1";

      setShowDemoButton(showDemo);
    } catch (err) {
      console.log(err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      resetFilter();
      loadSettings();

      if (isNVGN) refreshToday();
    }, [isNVGN]),
  );

  useEffect(() => {
    if (user?.role === "QL" || user?.role === "SUPERADMIN") {
      fetchStats(buildParams());
    }
  }, [range, selectedDate, selectedMonth, selectedQuarter, selectedYear]);

  return (
    <View style={{ flex: 1 }}>
      {/* Background với gradient và hiệu ứng đẹp hơn */}
      <LinearGradient
        colors={["#e8edf5", "#f0f4fa", "#e8edf5"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Các circle trang trí với hiệu ứng đẹp hơn */}
      <View style={styles.circle1}>
        <LinearGradient
          colors={["#3b82f6", "#60a5fa"]}
          style={styles.circleGradient}
        />
      </View>
      <View style={styles.circle2}>
        <LinearGradient
          colors={["#8b5cf6", "#a78bfa"]}
          style={styles.circleGradient}
        />
      </View>
      <View style={styles.circle3}>
        <LinearGradient
          colors={["#14b8a6", "#5eead4"]}
          style={styles.circleGradient}
        />
      </View>
      <View style={styles.circle4}>
        <LinearGradient
          colors={["#f59e0b", "#fbbf24"]}
          style={styles.circleGradient}
        />
      </View>
      <View style={styles.circle5}>
        <LinearGradient
          colors={["#2563eb", "#3b82f6"]}
          style={styles.circleGradient}
        />
      </View>
      <View style={styles.circle6}>
        <LinearGradient
          colors={["#ec4899", "#f472b6"]}
          style={styles.circleGradient}
        />
      </View>
      <View style={styles.circle7}>
        <LinearGradient
          colors={["#06b6d4", "#67e8f9"]}
          style={styles.circleGradient}
        />
      </View>

      {/* Chấm nhỏ trang trí */}
      <View style={styles.dotsContainer}>
        {[...Array(120)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                left: (i * 131) % width,
                top: (i * 73) % height,
                opacity: 0.05 + (i % 5) * 0.01,
                width: 1.5 + (i % 3),
                height: 1.5 + (i % 3),
              },
            ]}
          />
        ))}
      </View>

      {/* Hiệu ứng ánh sáng */}
      <View style={styles.lightEffect1} />
      <View style={styles.lightEffect2} />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER MỚI - ĐẸP HƠN */}
          <LinearGradient
            colors={["#2563eb", "#1d4ed8", "#1e40af"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.greetingContainer}>
                <View style={styles.iconCircle}>
                  <Ionicons name={getGreetingIcon()} size={28} color="#fff" />
                </View>
                <View>
                  <Text style={styles.greetingText}>{getGreeting()}</Text>
                  <Text style={styles.userName}>{user?.name} 👋</Text>
                </View>
              </View>
            </View>
            {/* <View style={styles.headerBottom}>
              <View style={styles.headerBadge}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeText}>Hệ thống đang hoạt động</Text>
              </View>
              <View style={styles.statsBrief}>
                <View style={styles.briefItem}>
                  <Ionicons name="calendar-outline" size={16} color="#bfdbfe" />
                  <Text style={styles.briefText}>
                    {currentTime.toLocaleDateString("vi-VN")}
                  </Text>
                </View>
                <View style={styles.briefDivider} />
                <View style={styles.briefItem}>
                  <Ionicons name="time-outline" size={16} color="#bfdbfe" />
                  <Text style={styles.briefText}>
                    {currentTime.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            </View> */}
          </LinearGradient>

          {isNVGN && (
            <TodayOrdersCard orders={todayOrders} loading={todayLoading} />
          )}

          <View style={styles.filterBox}>
            {/* RANGE SELECT */}
            <View style={styles.select}>
              <View style={styles.selectRow}>
                {["day", "month", "quarter", "year", "all"].map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRange(r as any)}
                    style={[styles.pill, range === r && styles.pillActive]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        range === r && styles.pillTextActive,
                      ]}
                    >
                      {r === "day"
                        ? "Ngày"
                        : r === "month"
                          ? "Tháng"
                          : r === "quarter"
                            ? "Quý"
                            : r === "year"
                              ? "Năm"
                              : "Tất cả"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* VALUE INPUT */}
            <View style={styles.valueBox}>
              {/* DAY */}
              {range === "day" && (
                <TouchableOpacity
                  onPress={() => setShowPicker(true)}
                  style={styles.valuePill}
                >
                  <Text style={styles.valuePillText}>
                    {formatDate(selectedDate)}
                  </Text>
                </TouchableOpacity>
              )}

              {/* MONTH */}
              {range === "month" && (
                <TouchableOpacity
                  onPress={() => setShowPicker(true)}
                  style={styles.valuePill}
                >
                  <Text style={styles.valuePillText}>
                    {formatMonth(selectedMonth)}
                  </Text>
                </TouchableOpacity>
              )}

              {/* QUARTER */}
              {range === "quarter" && (
                <View style={styles.quarterRow}>
                  {[1, 2, 3, 4].map((q) => (
                    <TouchableOpacity
                      key={q}
                      onPress={() => setSelectedQuarter(q)}
                      style={[
                        styles.pill,
                        selectedQuarter === q && styles.pillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          selectedQuarter === q && styles.pillTextActive,
                        ]}
                      >
                        Quý {q}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {/* YEAR */}
                  <TouchableOpacity
                    onPress={() => setShowPicker(true)}
                    style={styles.valuePill}
                  >
                    <Text style={styles.valuePillText}>{selectedYear}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {showPicker && (
                <DateTimePicker
                  value={
                    range === "day"
                      ? parseDate(selectedDate)
                      : range === "month"
                        ? new Date(
                            Number(selectedMonth.split("-")[0]),
                            Number(selectedMonth.split("-")[1]) - 1,
                            1,
                          )
                        : new Date(selectedYear, 0)
                  }
                  mode={range === "day" ? "date" : "date"}
                  display="default"
                  onChange={(event, date) => {
                    setShowPicker(false);
                    if (!date) return;

                    if (range === "day") {
                      setSelectedDate(toDateString(date));
                    }

                    if (range === "month") {
                      setSelectedMonth(toMonthString(date));
                    }

                    if (range === "year" || range === "quarter") {
                      setSelectedYear(date.getFullYear());
                    }
                  }}
                />
              )}

              {/* YEAR */}
              {range === "year" && (
                <TouchableOpacity
                  onPress={() => setShowPicker(true)}
                  style={styles.valuePill}
                >
                  <Text style={styles.valuePillText}>{selectedYear}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* STATS GRID */}
          <View style={styles.grid}>
            <StatCard
              style={styles.card}
              title="Tổng đơn"
              value={stats?.total}
              loading={loading}
              color="#2563eb"
              icon="cube-outline"
              onPress={() =>
                navigation.navigate("Orders", {
                  screen: "OrderList",
                  params: {
                    filter: "ALL",
                    fromDashboard: true,
                    refreshKey: Date.now(),
                  },
                })
              }
            />

            {!isNVGN && !showDemoButton && (
              <StatCard
                style={styles.card}
                title="Chờ tiếp nhận"
                value={stats?.waiting}
                loading={loading}
                color="#ef4444"
                icon="layers-outline"
                onPress={() =>
                  navigation.navigate("Orders", {
                    screen: "OrderList",
                    params: {
                      filter: "ALL",
                      status: ["PENDING"],
                      fromDashboard: true,
                      refreshKey: Date.now(),
                    },
                  })
                }
              />
            )}

            <StatCard
              style={styles.card}
              title={isNVGN ? "Được điều phối" : "Đã điều phối"}
              value={stats?.assigned}
              loading={loading}
              color="#3b82f6"
              icon="person-outline"
              onPress={() =>
                navigation.navigate("Orders", {
                  screen: "OrderList",
                  params: {
                    filter: "ALL",
                    status: ["ASSIGNED"],
                    fromDashboard: true,
                    refreshKey: Date.now(),
                  },
                })
              }
            />

            {!showDemoButton && (
              <>
                <StatCard
                  style={styles.card}
                  title="Đang thực hiện"
                  value={stats?.processing}
                  loading={loading}
                  color="#d3cf01"
                  icon="time-outline"
                  onPress={() =>
                    navigation.navigate("Orders", {
                      screen: "OrderList",
                      params: {
                        filter: "ALL",
                        status: ["PROCESSING"],
                        fromDashboard: true,
                        refreshKey: Date.now(),
                      },
                    })
                  }
                />

                {!isNVGN && (
                  <StatCard
                    style={styles.card}
                    title="Cần bổ sung"
                    value={stats?.supplement}
                    loading={loading}
                    color="#ffac13"
                    icon="alert-circle-outline"
                    onPress={() =>
                      navigation.navigate("Orders", {
                        screen: "OrderList",
                        params: {
                          filter: "ALL",
                          status: ["SUPPLEMENT_REQUIRED"],
                          fromDashboard: true,
                          refreshKey: Date.now(),
                        },
                      })
                    }
                  />
                )}

                {isNVGN && (
                  <StatCard
                    style={styles.card}
                    title="Hoàn thành"
                    value={stats?.shipper_completed}
                    loading={loading}
                    color="#059669"
                    icon="checkmark-done-circle-outline"
                    onPress={() =>
                      navigation.navigate("Orders", {
                        screen: "OrderList",
                        params: {
                          filter: "DONE_GROUP",
                          fromDashboard: true,
                          refreshKey: Date.now(),
                        },
                      })
                    }
                  />
                )}

                {!isNVGN && (
                  <>
                    <StatCard
                      style={styles.card}
                      title="Đã xong"
                      value={stats?.completed}
                      loading={loading}
                      color="#9333ea"
                      icon="checkmark-circle-outline"
                      onPress={() =>
                        navigation.navigate("Orders", {
                          screen: "OrderList",
                          params: {
                            filter: "ALL",
                            status: ["COMPLETED"],
                            fromDashboard: true,
                            refreshKey: Date.now(),
                          },
                        })
                      }
                    />

                    <StatCard
                      style={styles.card}
                      title="Hoàn tất"
                      value={stats?.finished}
                      loading={loading}
                      color="#059669"
                      icon="checkmark-done-circle-outline"
                      onPress={() =>
                        navigation.navigate("Orders", {
                          screen: "OrderList",
                          params: {
                            filter: "ALL",
                            status: ["FINISHED"],
                            fromDashboard: true,
                            refreshKey: Date.now(),
                          },
                        })
                      }
                    />

                    <StatCard
                      style={styles.card}
                      title="Từ chối"
                      value={stats?.rejected}
                      loading={loading}
                      color="#6b7280"
                      icon="close-circle-outline"
                      onPress={() =>
                        navigation.navigate("Orders", {
                          screen: "OrderList",
                          params: {
                            filter: "ALL",
                            status: ["REJECTED"],
                            fromDashboard: true,
                            refreshKey: Date.now(),
                          },
                        })
                      }
                    />

                    <StatCard
                      style={styles.card}
                      title="Hoàn đơn (khách hàng)"
                      value={stats?.returned_customer}
                      loading={loading}
                      color="#ef4444"
                      icon="arrow-undo-circle-outline"
                      onPress={() =>
                        navigation.navigate("Orders", {
                          screen: "OrderList",
                          params: {
                            filter: "ALL",
                            status: ["RETURNED_CUSTOMER"],
                            fromDashboard: true,
                            refreshKey: Date.now(),
                          },
                        })
                      }
                    />

                    <StatCard
                      style={styles.card}
                      title="Hoàn đơn (cá nhân)"
                      value={stats?.returned_personal}
                      loading={loading}
                      color="#6b7280"
                      icon="arrow-undo-circle-outline"
                      onPress={() =>
                        navigation.navigate("Orders", {
                          screen: "OrderList",
                          params: {
                            filter: "ALL",
                            status: ["RETURNED_PERSONAL"],
                            fromDashboard: true,
                            refreshKey: Date.now(),
                          },
                        })
                      }
                    />

                    <StatCard
                      style={styles.card}
                      title="Đã lưu trữ"
                      value={stats?.archived}
                      loading={loading}
                      color="#50555e"
                      icon="archive-outline"
                      onPress={() =>
                        navigation.navigate("Orders", {
                          screen: "OrderList",
                          params: {
                            filter: "ALL",
                            status: ["ARCHIVED"],
                            fromDashboard: true,
                            refreshKey: Date.now(),
                          },
                        })
                      }
                    />

                    <StatCard
                      style={styles.card}
                      title="Chưa hoàn thành"
                      value={stats?.incomplete}
                      loading={loading}
                      color="#ec4899"
                      icon="warning-outline"
                      onPress={() =>
                        navigation.navigate("Orders", {
                          screen: "OrderList",
                          params: {
                            filter: "ALL",
                            status: ["INCOMPLETE"],
                            fromDashboard: true,
                            refreshKey: Date.now(),
                          },
                        })
                      }
                    />
                  </>
                )}
              </>
            )}
          </View>

          {(user?.role === "QL" || user?.role === "SUPERADMIN") && (
            <View style={styles.shipperBox}>
              <Text style={styles.sectionTitle}>
                🚚 Hiệu suất nhân viên giao nhận
              </Text>

              {shipperLoading
                ? [1, 2, 3].map((i) => (
                    <View key={i} style={styles.shipperItem}>
                      <View style={styles.skeletonLine} />
                      <View style={styles.skeletonBar} />
                      <View style={styles.skeletonSmall} />
                    </View>
                  ))
                : shipperStats.map((s, index) => (
                    <View key={index} style={styles.shipperItem}>
                      {/* Header */}
                      <View style={styles.shipperHeader}>
                        <Text style={styles.shipperName}>{s.name}</Text>
                        <Text style={styles.shipperTotal}>
                          {s.stats.total_orders} đơn
                        </Text>
                      </View>

                      {/* Progress */}
                      <View style={styles.progressBg}>
                        <View
                          style={[
                            styles.progressBar,
                            { width: `${s.stats.success_rate}%` },
                          ]}
                        />
                      </View>

                      {/* Stats */}
                      <View style={styles.shipperStatsRow}>
                        {/* SUCCESS */}
                        <TouchableOpacity
                          onPress={() => {
                            setTooltip(
                              tooltip?.index === index &&
                                tooltip?.type === "success"
                                ? null
                                : { index, type: "success" },
                            );
                            setTimeout(() => setTooltip(null), 1500);
                          }}
                          style={[styles.statItem, { position: "relative" }]}
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color="#16a34a"
                          />
                          <Text style={styles.success}>
                            {s.stats.success_orders}
                          </Text>

                          {tooltip?.index === index &&
                            tooltip?.type === "success" && (
                              <View style={styles.tooltip}>
                                <Text style={styles.tooltipText}>
                                  Các đơn đã xong và đơn hoàn tất
                                </Text>
                              </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            setTooltip(
                              tooltip?.index === index &&
                                tooltip?.type === "reject"
                                ? null
                                : { index, type: "reject" },
                            );
                            setTimeout(() => setTooltip(null), 1500);
                          }}
                          style={[styles.statItem, { position: "relative" }]}
                        >
                          <Ionicons
                            name="close-circle"
                            size={16}
                            color="#6b7280"
                          />
                          <Text style={styles.gray}>
                            {s.stats.rejected_orders}
                          </Text>

                          {tooltip?.index === index &&
                            tooltip?.type === "reject" && (
                              <View style={styles.tooltip}>
                                <Text style={styles.tooltipText}>
                                  Các đơn đã bị từ chối và đơn yêu cầu bổ sung
                                  thêm
                                </Text>
                              </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            setTooltip(
                              tooltip?.index === index &&
                                tooltip?.type === "return"
                                ? null
                                : { index, type: "return" },
                            );
                            setTimeout(() => setTooltip(null), 1500);
                          }}
                          style={[styles.statItem, { position: "relative" }]}
                        >
                          <Ionicons
                            name="arrow-undo-circle"
                            size={16}
                            color="#dc2626"
                          />
                          <Text style={styles.red}>
                            {s.stats.returned_orders}
                          </Text>

                          {tooltip?.index === index &&
                            tooltip?.type === "return" && (
                              <View style={styles.tooltip}>
                                <Text style={styles.tooltipText}>
                                  Các đơn đã hoàn trả
                                </Text>
                              </View>
                            )}
                        </TouchableOpacity>

                        {/* RATE */}
                        <View style={styles.rateBox}>
                          <Ionicons
                            name="trending-up"
                            size={16}
                            color="#2563eb"
                          />
                          <Text style={styles.rate}>
                            {s.stats.success_rate}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
            </View>
          )}

          {/* DEPARTMENT */}
          {!showDemoButton && (
            <View style={styles.deptBox}>
              <Text style={styles.sectionTitle}>📊 Thống kê bộ phận</Text>

              <DeptBar
                name="Visa Việt Nam"
                count={stats?.vsvn}
                total={stats?.total}
                color="#3b82f6"
              />

              <DeptBar
                name="Visa Nước Ngoài"
                count={stats?.vsnn}
                total={stats?.total}
                color="#8b5cf6"
              />

              <DeptBar
                name="Giấy Phép Lao Động"
                count={stats?.gpld}
                total={stats?.total}
                color="#14b8a6"
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },

  circle1: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -100,
    left: -100,
    overflow: "hidden",
  },
  circle2: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: 175,
    top: "15%",
    right: -120,
    overflow: "hidden",
  },
  circle3: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    bottom: "25%",
    left: -80,
    overflow: "hidden",
  },
  circle4: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    bottom: "5%",
    right: -100,
    overflow: "hidden",
  },
  circle5: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
    top: "45%",
    left: "20%",
    overflow: "hidden",
  },
  circle6: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    bottom: "35%",
    right: "15%",
    overflow: "hidden",
  },
  circle7: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    top: "60%",
    left: "5%",
    overflow: "hidden",
  },
  circleGradient: {
    flex: 1,
    opacity: 0.04,
  },

  dotsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dot: {
    position: "absolute",
    borderRadius: 10,
    backgroundColor: "#64748b",
  },

  lightEffect1: {
    position: "absolute",
    top: "10%",
    right: "5%",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#60a5fa",
    opacity: 0.05,
    transform: [{ scale: 1 }],
  },
  lightEffect2: {
    position: "absolute",
    bottom: "15%",
    left: "0%",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#a78bfa",
    opacity: 0.05,
  },

  // HEADER MỚI
  headerGradient: {
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 20,
    paddingTop: 20,
    // paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#1e40af",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },

  greetingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },

  userName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    flexShrink: 1,
  },

  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    flexShrink: 0,
  },

  headerBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },

  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  greetingText: {
    fontSize: 14,
    color: "#bfdbfe",
    fontWeight: "500",
    marginBottom: 4,
  },

  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },

  badgeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },

  statsBrief: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    alignSelf: "flex-start",
    gap: 12,
  },

  briefItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  briefDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.3)",
  },

  briefText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "500",
  },

  // Các style cũ giữ nguyên
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    marginBottom: 12,
  },

  deptBox: {
    marginTop: 24,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 14,

    borderWidth: 1,
    borderColor: "#f1f5f9",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },

    elevation: 4,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },

  filterBox: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,

    borderWidth: 1,
    borderColor: "#f1f5f9",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },

    elevation: 5,
  },

  selectLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 8,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  selectRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },

  option: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },

  optionActive: {
    backgroundColor: "#2563eb",
    color: "#fff",
  },

  valueBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },

  value: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },

  select: { marginBottom: 10 },

  quarterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  pillActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },

  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },

  pillTextActive: {
    color: "#fff",
  },

  yearPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },

  yearText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
  },

  valuePill: {
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: "#f8fafc",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  valuePillText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },

  shipperBox: {
    marginTop: 24,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },

  shipperItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 10,
  },

  shipperHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  shipperName: {
    fontWeight: "700",
    color: "#1e293b",
  },

  shipperTotal: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "700",
  },

  progressBg: {
    height: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 8,
  },

  progressBar: {
    height: "100%",
    backgroundColor: "#22c55e",
  },

  shipperStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  success: { color: "#16a34a", fontWeight: "600" },
  gray: { color: "#6b7280", fontWeight: "600" },
  red: { color: "#dc2626", fontWeight: "600" },

  rate: {
    marginLeft: "auto",
    fontWeight: "700",
    color: "#2563eb",
  },

  skeletonLine: {
    height: 14,
    width: 120,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
    marginBottom: 6,
  },
  skeletonBar: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
    marginBottom: 6,
  },
  skeletonSmall: {
    height: 10,
    width: 80,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
  },

  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  rateBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },

  tooltip: {
    position: "absolute",
    bottom: 22,
    left: 0,
    backgroundColor: "#111",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  tooltipText: {
    color: "#fff",
    fontSize: 12,
  },
});
