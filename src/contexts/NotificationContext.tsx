import { createContext, useContext, useEffect } from "react";
import useNotifications from "../hooks/useNotifications";
import { authService } from "../services/auth.service";
import { connectSocket, disconnectSocket } from "../services/socket.service";
import { useOrderContext } from "./OrderContext";
import { registerForPushNotifications } from "../services/push.service";
import * as Notifications from "expo-notifications";
import { useAuth } from "./AuthContext";
import Toast from "react-native-toast-message";
import { navigate } from "../navigation/navigationRef";
import { AppState } from "react-native";
import { notificationService } from "../services/notification.service";

const NotificationContext = createContext<any>(null);

export const NotificationProvider = ({ children }: any) => {
  const notifications = useNotifications();
  const { reloadOrderCounts, setPendingOrdersCount } = useOrderContext();
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user) return;

    const init = async () => {
      await registerForPushNotifications(token);

      notifications.reload();

      connectSocket(user.id, user.role, {
        notification: (data) => {
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

          notifications.reload();
        },

        notificationRead: () => {
          notifications.reload();
        },

        notificationReadAll: () => {
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
      disconnectSocket();
    };
  }, [user]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const data = response.notification.request.content.data;

        try {
          if (data?.notificationId) {
            await notificationService.markRead(Number(data.notificationId));
          }
        } catch (err) {
          console.log("markRead error:", err);
        }

        if (data?.orderId) {
          navigate("Orders", {
            screen: "OrderList",
            params: {
              openOrderId: String(data.orderId),
            },
          });
        }
      },
    );

    return () => sub.remove();
  }, []);

  useEffect(() => {
    const checkInitialNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();

      if (!response) return;

      const data = response.notification.request.content.data;

      if (data?.orderId) {
        navigate("Orders", {
          screen: "OrderList",
          params: {
            openOrderId: String(data.orderId),
          },
        });
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
