// // import { NavigationContainer } from "@react-navigation/native";
// // import { createNativeStackNavigator } from "@react-navigation/native-stack";
// // import { SafeAreaProvider } from "react-native-safe-area-context";
// // import { GestureHandlerRootView } from "react-native-gesture-handler";

// // import LoginScreen from "./src/screens/LoginScreen";
// // import MainTabs from "./src/navigation/MainTabs";
// // import { NotificationProvider } from "./src/contexts/NotificationContext";
// // import { OrderProvider } from "./src/contexts/OrderContext";
// // import * as Notifications from "expo-notifications";
// // import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
// // import { Platform, TouchableOpacity, View } from "react-native";
// // import Toast, { BaseToast } from "react-native-toast-message";
// // import { navigationRef, navigate } from "./src/navigation/navigationRef";
// // import { notificationService } from "./src/services/notification.service";
// // import { Ionicons } from "@expo/vector-icons";
// // import NetInfo from "@react-native-community/netinfo";
// // import { useState, useEffect } from "react";
// // import NoInternetScreen from "./src/screens/NoInternetScreen";

// // Notifications.setNotificationHandler({
// //   handleNotification: async () => ({
// //     shouldShowAlert: true,
// //     shouldPlaySound: true,
// //     shouldSetBadge: true,
// //     shouldShowBanner: true,
// //     shouldShowList: true,
// //   }),
// // });

// // const toastConfig = {
// //   success: ({ text1, text2, props }: any) => (
// //     <BaseToast
// //       onPress={async () => {
// //         if (props?.notificationId) {
// //           await notificationService.markRead(Number(props.notificationId));
// //         }

// //         if (props?.orderId) {
// //           navigate("Main", {
// //             screen: "Orders",
// //             params: {
// //               screen: "OrderList",
// //               params: {
// //                 openOrderId: String(props.orderId),
// //               },
// //             },
// //           });
// //         }

// //         Toast.hide();
// //       }}
// //       style={{
// //         borderLeftWidth: 0,
// //         backgroundColor: "#ffffff",
// //         borderRadius: 16,
// //         paddingVertical: 12,
// //         paddingHorizontal: 12,
// //         marginHorizontal: 12,
// //         elevation: 5,
// //         shadowColor: "#000",
// //         shadowOpacity: 0.1,
// //         shadowRadius: 8,
// //         shadowOffset: { width: 0, height: 4 },
// //       }}
// //       contentContainerStyle={{
// //         paddingHorizontal: 0,
// //       }}
// //       renderLeadingIcon={() => (
// //         <View
// //           style={{
// //             width: 44,
// //             height: 44,
// //             borderRadius: 12,
// //             backgroundColor: "#ecfeff",
// //             alignItems: "center",
// //             justifyContent: "center",
// //             marginRight: 10,
// //           }}
// //         >
// //           <Ionicons name="notifications" size={22} color="#06b6d4" />
// //         </View>
// //       )}
// //       text1={text1}
// //       text2={text2}
// //       text1Style={{
// //         fontSize: 14,
// //         fontWeight: "700",
// //         color: "#111827",
// //       }}
// //       text2Style={{
// //         fontSize: 13,
// //         color: "#6b7280",
// //         marginTop: 2,
// //       }}
// //     />
// //   ),
// // };

// // function RootNavigator() {
// //   const { user, loading } = useAuth();

// //   if (loading) return null;

// //   return (
// //     <Stack.Navigator screenOptions={{ headerShown: false }}>
// //       {user ? (
// //         <Stack.Screen name="Main" component={MainTabs} />
// //       ) : (
// //         <Stack.Screen name="Login" component={LoginScreen} />
// //       )}
// //     </Stack.Navigator>
// //   );
// // }

// // const Stack = createNativeStackNavigator();

// // export default function App() {
// //   useEffect(() => {
// //     if (Platform.OS === "android") {
// //       Notifications.setNotificationChannelAsync("default", {
// //         name: "default",
// //         importance: Notifications.AndroidImportance.MAX,
// //         sound: null,
// //         vibrationPattern: [0, 250, 250, 250],
// //         lockscreenVisibility:
// //           Notifications.AndroidNotificationVisibility.PUBLIC,
// //       });
// //     }
// //   }, []);

// //   const [isConnected, setIsConnected] = useState(true);

// //   useEffect(() => {
// //     const unsubscribe = NetInfo.addEventListener((state) => {
// //       setIsConnected(!!state.isConnected);
// //     });

// //     return () => unsubscribe();
// //   }, []);

// //   if (!isConnected) {
// //     return <NoInternetScreen />;
// //   }

// //   return (
// //     <>
// //       <GestureHandlerRootView style={{ flex: 1 }}>
// //         <SafeAreaProvider>
// //           <AuthProvider>
// //             <OrderProvider>
// //               <NotificationProvider>
// //                 <NavigationContainer ref={navigationRef}>
// //                   <RootNavigator />
// //                 </NavigationContainer>
// //               </NotificationProvider>
// //             </OrderProvider>
// //           </AuthProvider>
// //         </SafeAreaProvider>
// //       </GestureHandlerRootView>
// //       <Toast config={toastConfig} />
// //     </>
// //   );
// // }

// import React, { useState, useEffect, useCallback } from "react";
// import { AppState, Platform } from "react-native";
// import { NavigationContainer } from "@react-navigation/native";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import { SafeAreaProvider } from "react-native-safe-area-context";
// import { GestureHandlerRootView } from "react-native-gesture-handler";

// import LoginScreen from "./src/screens/LoginScreen";
// import MainTabs from "./src/navigation/MainTabs";
// import { NotificationProvider } from "./src/contexts/NotificationContext";
// import { OrderProvider } from "./src/contexts/OrderContext";
// import * as Notifications from "expo-notifications";
// import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
// import Toast, { BaseToast } from "react-native-toast-message";
// import { navigationRef, navigate } from "./src/navigation/navigationRef";
// import { notificationService } from "./src/services/notification.service";
// import { Ionicons } from "@expo/vector-icons";
// import { View } from "react-native";
// import NetInfo from "@react-native-community/netinfo";
// import NoInternetScreen from "./src/screens/NoInternetScreen";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { startTracking } from "./src/services/location-tracking.service";

// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//     shouldShowBanner: true,
//     shouldShowList: true,
//   }),
// });

// const toastConfig = {
//   success: ({ text1, text2, props }: any) => (
//     <BaseToast
//       onPress={async () => {
//         if (props?.notificationId) {
//           await notificationService.markRead(Number(props.notificationId));
//         }

//         if (props?.orderId) {
//           navigate("Main", {
//             screen: "Orders",
//             params: {
//               screen: "OrderList",
//               params: {
//                 openOrderId: String(props.orderId),
//               },
//             },
//           });
//         }

//         Toast.hide();
//       }}
//       style={{
//         borderLeftWidth: 0,
//         backgroundColor: "#ffffff",
//         borderRadius: 16,
//         paddingVertical: 12,
//         paddingHorizontal: 12,
//         marginHorizontal: 12,
//         elevation: 5,
//         shadowColor: "#000",
//         shadowOpacity: 0.1,
//         shadowRadius: 8,
//         shadowOffset: { width: 0, height: 4 },
//       }}
//       contentContainerStyle={{
//         paddingHorizontal: 0,
//       }}
//       renderLeadingIcon={() => (
//         <View
//           style={{
//             width: 44,
//             height: 44,
//             borderRadius: 12,
//             backgroundColor: "#ecfeff",
//             alignItems: "center",
//             justifyContent: "center",
//             marginRight: 10,
//           }}
//         >
//           <Ionicons name="notifications" size={22} color="#06b6d4" />
//         </View>
//       )}
//       text1={text1}
//       text2={text2}
//       text1Style={{
//         fontSize: 14,
//         fontWeight: "700",
//         color: "#111827",
//       }}
//       text2Style={{
//         fontSize: 13,
//         color: "#6b7280",
//         marginTop: 2,
//       }}
//     />
//   ),
// };

// function RootNavigator() {
//   const { user, loading } = useAuth();

//   if (loading) return null;

//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       {user ? (
//         <Stack.Screen name="Main" component={MainTabs} />
//       ) : (
//         <Stack.Screen name="Login" component={LoginScreen} />
//       )}
//     </Stack.Navigator>
//   );
// }

// const Stack = createNativeStackNavigator();

// export default function App() {
//   const [isConnected, setIsConnected] = useState(true);
//   const [isChecking, setIsChecking] = useState(false);

//   useEffect(() => {
//     if (Platform.OS === "android") {
//       Notifications.setNotificationChannelAsync("default", {
//         name: "default",
//         importance: Notifications.AndroidImportance.MAX,
//         sound: null,
//         vibrationPattern: [0, 250, 250, 250],
//         lockscreenVisibility:
//           Notifications.AndroidNotificationVisibility.PUBLIC,
//       });
//     }
//   }, []);

//   useEffect(() => {
//     const restoreTracking = async () => {
//       const orderId = await AsyncStorage.getItem("tracking_order_id");

//       if (orderId) {
//         await startTracking(Number(orderId));
//       }
//     };

//     restoreTracking();
//   }, []);

//   useEffect(() => {
//     const unsubscribe = NetInfo.addEventListener((state) => {
//       setIsConnected(!!state.isConnected);
//     });

//     return () => unsubscribe();
//   }, []);

//   // Hàm thử lại kết nối
//   const handleRetry = useCallback(async () => {
//     setIsChecking(true);
//     try {
//       const state = await NetInfo.fetch();
//       setIsConnected(!!state.isConnected);
//     } catch (error) {
//       console.log("Error checking network:", error);
//     } finally {
//       setIsChecking(false);
//     }
//   }, []);

//   return (
//     <>
//       <GestureHandlerRootView style={{ flex: 1 }}>
//         <SafeAreaProvider>
//           <AuthProvider>
//             <OrderProvider>
//               <NotificationProvider>
//                 <NavigationContainer ref={navigationRef}>
//                   <RootNavigator />
//                 </NavigationContainer>
//               </NotificationProvider>
//             </OrderProvider>
//           </AuthProvider>
//         </SafeAreaProvider>
//       </GestureHandlerRootView>

//       <Toast config={toastConfig} />

//       {/* No Internet Modal */}
//       <NoInternetScreen
//         visible={!isConnected}
//         onRetry={handleRetry}
//         isChecking={isChecking}
//       />
//     </>
//   );
// }
import 'react-native-gesture-handler';
import React, { useState, useEffect, useCallback } from "react";
import { AppState, Platform, View } from "react-native";
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
import {
  LocationPermissionProvider,
  useLocationPermission,
} from "./src/contexts/LocationPermissionContext";
import Toast, { BaseToast } from "react-native-toast-message";
import { navigationRef, navigate } from "./src/navigation/navigationRef";
import { notificationService } from "./src/services/notification.service";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import NoInternetScreen from "./src/screens/NoInternetScreen";
import LocationPermissionModal from "./src/components/LocationPermissionModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { startTracking } from "./src/services/location-tracking.service";
import { DemoScreen } from "./src/screens/DemoScreen";

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
  const { permissionStatus } = useLocationPermission();

  if (loading || permissionStatus === "checking") return null;

  // Chỉ cho phép vào app khi đã có quyền "Luôn luôn"
  if (permissionStatus !== "granted_always") {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Empty" component={View} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="DemoScreen" component={DemoScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const Stack = createNativeStackNavigator();

function AppContent() {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const { permissionStatus } = useLocationPermission(); // Thêm dòng này

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

  useEffect(() => {
    // Chỉ bắt đầu tracking khi đã có quyền "always"
    if (permissionStatus === "granted_always") {
      const restoreTracking = async () => {
        const orderId = await AsyncStorage.getItem("tracking_order_id");
        if (orderId) {
          await startTracking(Number(orderId));
        }
      };
      restoreTracking();
    }
  }, [permissionStatus]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(!!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Hàm thử lại kết nối
  const handleRetry = useCallback(async () => {
    setIsChecking(true);
    try {
      const state = await NetInfo.fetch();
      setIsConnected(!!state.isConnected);
    } catch (error) {
      console.log("Error checking network:", error);
    } finally {
      setIsChecking(false);
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
                </NavigationContainer>
              </NotificationProvider>
            </OrderProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>

      <Toast config={toastConfig} />

      <LocationPermissionModal />

      {/* No Internet Modal */}
      <NoInternetScreen
        visible={!isConnected}
        onRetry={handleRetry}
        isChecking={isChecking}
      />
    </>
  );
}

export default function App() {
  return (
    <LocationPermissionProvider>
      <AppContent />
    </LocationPermissionProvider>
  );
}
