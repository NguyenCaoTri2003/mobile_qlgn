import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator } from "react-native";

import { useNotificationContext } from "../contexts/NotificationContext";
import { notificationService } from "../services/notification.service";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import NotificationCard from "../components/notification/NotificationCard";
import EmptyState from "../components/EmptyState";
import { Ionicons } from "@expo/vector-icons";

export default function NotificationScreen() {
  const { notifications, reload, loadMore, hasMore } = useNotificationContext();

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const navigation: any = useNavigation();

  const formatTime = (timestamp: number) => {
    const date = new Date(Number(timestamp));
    return date.toLocaleString("vi-VN");
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        if (!notifications || notifications.length === 0) return null;

        return (
          <TouchableOpacity style={styles.readAllBtn} onPress={markAllAsRead}>
            <Ionicons name="checkmark-done" size={14} color="#2563eb" />
            <Text style={styles.readAllText}>Đọc tất cả</Text>
          </TouchableOpacity>
        );
      },
    });
  }, [notifications]);

  const markAllAsRead = async () => {
    await notificationService.markAllRead();
    reload();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      reload();
    }, []),
  );

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    await loadMore();
    setLoadingMore(false);
  };

  const handleOpen = async (item: any) => {
    if (item.read_status === 0) {
      await notificationService.markRead(item.id);
    }

    reload();

    navigation.navigate("Orders", {
      screen: "OrderDetail",
      params: { id: Number(item.orderId) },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <FlatList
        onScrollBeginDrag={() => setIsScrolling(true)}
        onScrollEndDrag={() => setIsScrolling(false)}
        data={notifications}
        keyExtractor={(item) =>
          `${item.id}-${item.timestamp}-${item.order_id || ""}`
        }
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <NotificationCard
            item={{
              ...item,
              time: formatTime(item.timestamp),
            }}
            onPress={() => {
              if (isScrolling) return;
              handleOpen(item);
            }}
          />
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="Chưa có thông báo"
            description="Hiện vẫn chưa có thông báo nào 📭"
          />
        }
        ListFooterComponent={() => {
          if (loadingMore) {
            return (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={{ marginTop: 6 }}>Đang tải thêm...</Text>
              </View>
            );
          }

          if (!hasMore && notifications.length > 0) {
            return (
              <View style={styles.footer}>
                <Text style={{ color: "#9ca3af" }}>🎉 Bạn đã xem hết rồi</Text>
              </View>
            );
          }

          return null;
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },

  readAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,

    // backgroundColor: "#2563eb",
    borderColor: "#2563eb",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,

    shadowColor: "#2563eb",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },

  readAllText: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "600",
  },

  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
