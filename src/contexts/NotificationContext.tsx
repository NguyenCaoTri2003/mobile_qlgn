import { createContext, useContext, useEffect, useRef } from "react";
import useNotifications from "../hooks/useNotifications";
import { connectSocket, disconnectSocket } from "../services/socket.service";
import { useOrderContext } from "./OrderContext";
import { registerForPushNotifications } from "../services/push.service";
import * as Notifications from "expo-notifications";
import { useAuth } from "./AuthContext";
import Toast from "react-native-toast-message";
import { navigate } from "../navigation/navigationRef";
import { AppState, Platform } from "react-native";
import { notificationService } from "../services/notification.service";

const NotificationContext = createContext<any>(null);

export const NotificationProvider = ({ children }: any) => {
  const notifications = useNotifications();
  const { reloadOrderCounts, setPendingOrdersCount } = useOrderContext();
  const { user, token } = useAuth();

  const isUpdatingBadge = useRef(false);
  const lastKnownUnreadCount = useRef(0);
  const isInitialized = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (state) => {
      if (state === "active" && user) {
        console.log("📱 App active -> reload notifications");

        try {
          await notifications.reload();

          // sync badge native
          const latestCount = notifications.unreadCount || 0;

          await Notifications.setBadgeCountAsync(latestCount);

          lastKnownUnreadCount.current = latestCount;
        } catch (err) {
          console.log(err);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user, notifications.unreadCount]);

  // Cập nhật badge khi unreadCount thay đổi
  useEffect(() => {
    const updateBadge = async () => {
      if (isUpdatingBadge.current) return;

      try {
        isUpdatingBadge.current = true;
        const count = notifications?.unreadCount;

        if (
          count !== undefined &&
          count !== null &&
          count >= 0 &&
          count !== lastKnownUnreadCount.current
        ) {
          await Notifications.setBadgeCountAsync(count);
          lastKnownUnreadCount.current = count;
          console.log("🔔 Badge updated to:", count);
        }
      } catch (err) {
        console.log("Update badge error:", err);
      } finally {
        isUpdatingBadge.current = false;
      }
    };

    updateBadge();
  }, [notifications?.unreadCount]);

  useEffect(() => {
    if (!user) return;

    const init = async () => {
      await registerForPushNotifications(token);

      // ✅ Gọi reload ngay để lấy unreadCount ban đầu
      await notifications.reload();
      isInitialized.current = true;

      connectSocket(user.id, user.role, {
        notification: (data) => {
          // Tăng badge trước khi reload
          Notifications.getBadgeCountAsync().then(async (currentBadge) => {
            const newBadge = Math.max(0, currentBadge + 1);
            lastKnownUnreadCount.current = newBadge;
            await Notifications.setBadgeCountAsync(newBadge);
            console.log(
              "🔔 New notification, badge:",
              currentBadge,
              "->",
              newBadge,
            );
          });

          // Nếu app đang mở -> hiện toast
          if (AppState.currentState === "active") {
            Toast.show({
              type: "success",
              text1: data?.title || "Nhị Gia Logistics",
              text2: data?.message || "",
              visibilityTime: 8000,
              position: "top",
              topOffset: 60,
              autoHide: true,
              props: {
                orderId: data?.orderId,
                notificationId: data?.id,
              },
            });
          }

          // Reload sau khi đã set badge
          notifications.reload();
        },

        notificationRead: () => {
          notifications.reload();
        },

        notificationReadAll: () => {
          notifications.reload();
        },

        notificationReadByOrder: () => {
          notifications.reload();
        },

        orderAssigned: (data) => {
          if (user.role === "NVGN") {
            if (data.pendingOrdersCount !== undefined) {
              setPendingOrdersCount(data.pendingOrdersCount);
            }
          } else {
            reloadOrderCounts();
          }
        },
      });
    };

    init();

    return () => {
      // disconnectSocket();
      isInitialized.current = false;
    };
  }, [user]);

  // Xử lý khi click vào notification (từ thanh notification của điện thoại)
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        // const data = response.notification.request.content.data;
        const rawData: any = response.notification.request.content.data;

        const data: any = {
          ...rawData,
          ...(rawData?.aps || {}),
        };

        try {
          if (data?.notificationId) {
            await notificationService.markRead(Number(data.notificationId));
          }
        } catch (err) {
          console.log("markRead error:", err);
        }

        notifications.reload();

        if (data?.orderId) {
          setTimeout(() => {
            navigate("Orders", {
              screen: "OrderList",
              params: {
                openOrderId: String(data.orderId),
              },
            });
          }, 500);
        }
      },
    );

    return () => sub.remove();
  }, []);

  // Kiểm tra notification khi mở app lần đầu
  useEffect(() => {
    const checkInitialNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();

      if (!response) return;

      // const data = response.notification.request.content.data;
      const rawData: any = response.notification.request.content.data;

      const data: any = {
        ...rawData,
        ...(rawData?.aps || {}),
      };

      if (data?.orderId) {
        setTimeout(() => {
          navigate("Orders", {
            screen: "OrderList",
            params: {
              openOrderId: String(data.orderId),
            },
          });
        }, 500);
      }
    };

    checkInitialNotification();
  }, []);

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  return useContext(NotificationContext);
};
