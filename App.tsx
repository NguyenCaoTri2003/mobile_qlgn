import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import LoginScreen from "./src/screens/LoginScreen";
import MainTabs from "./src/navigation/MainTabs";
import { NotificationProvider } from "./src/contexts/NotificationContext";
import { OrderProvider } from "./src/contexts/OrderContext";
import * as Notifications from "expo-notifications";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { Platform, TouchableOpacity, View } from "react-native";
import { useEffect } from "react";
import Toast, { BaseToast } from "react-native-toast-message";
import { navigationRef, navigate } from "./src/navigation/navigationRef";
import { notificationService } from "./src/services/notification.service";
import { Ionicons } from "@expo/vector-icons";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const toastConfig = {
  success: ({ text1, text2, props }: any) => (
    <BaseToast
      onPress={async () => {
        if (props?.notificationId) {
          await notificationService.markRead(Number(props.notificationId));
        }

        if (props?.orderId) {
          navigate("Main", {
            screen: "Orders",
            params: {
              screen: "OrderList",
              params: {
                openOrderId: String(props.orderId),
              },
            },
          });
        }

        Toast.hide();
      }}
      style={{
        borderLeftWidth: 0,
        backgroundColor: "#ffffff",
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 12,
        marginHorizontal: 12,
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      }}
      contentContainerStyle={{
        paddingHorizontal: 0,
      }}
      renderLeadingIcon={() => (
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: "#ecfeff",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
          }}
        >
          <Ionicons name="notifications" size={22} color="#06b6d4" />
        </View>
      )}
      text1={text1}
      text2={text2}
      text1Style={{
        fontSize: 14,
        fontWeight: "700",
        color: "#111827",
      }}
      text2Style={{
        fontSize: 13,
        color: "#6b7280",
        marginTop: 2,
      }}
    />
  ),
};

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        sound: null,
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }
  }, []);

  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <OrderProvider>
              <NotificationProvider>
                <NavigationContainer ref={navigationRef}>
                  <RootNavigator />
                  {/* <Stack.Navigator>
                    <Stack.Screen
                      name="Login"
                      component={LoginScreen}
                      options={{ headerShown: false }}
                    />

                    <Stack.Screen
                      name="Main"
                      component={MainTabs}
                      options={{ headerShown: false }}
                    />
                  </Stack.Navigator> */}
                </NavigationContainer>
              </NotificationProvider>
            </OrderProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
      <Toast config={toastConfig} />
    </>
  );
}
