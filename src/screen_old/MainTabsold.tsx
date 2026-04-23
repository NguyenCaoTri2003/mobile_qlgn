// import React from "react";
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

// import DashboardScreen from "../screens/DashboardScreen";
// import OrderListScreen from "../screens/OrderListScreen";
// import ProfileScreen from "../screens/ProfileScreen";
// import { Ionicons } from "@expo/vector-icons";
// import useNotifications from "../hooks/useNotifications";
// import OrdersStack from "./OrdersStack";
// import NotificationScreen from "../screens/NotificationScreen";
// import NotificationsStack from "./NotificationsStack";
// import { useNotificationContext } from "../contexts/NotificationContext";
// import { useOrderContext } from "../contexts/OrderContext";
// import ActivityLogScreen from "../screens/ActivityLogScreen";
// import { useAuth } from "../contexts/AuthContext";
// import ActivityLogStack from "./ActivityLogStack";
// import ProfileStack from "./ProfileStack";

// const Tab = createBottomTabNavigator();

// const formatBadge = (count: number) => {
//   if (!count) return undefined;
//   if (count > 99) return "99+";
//   return count;
// };

// export default function MainTabs() {
//   const { unreadCount } = useNotificationContext();
//   const { pendingOrdersCount } = useOrderContext();
//   const { user } = useAuth();

//   return (
//     <Tab.Navigator
//       screenOptions={{
//         headerShown: false,
//         tabBarActiveTintColor: "#2563eb",
//         tabBarBadgeStyle: {
//           backgroundColor: "#ef4444",
//           color: "white",
//           fontSize: 10,
//         },
//       }}
//     >
//       <Tab.Screen
//         name="Dashboard"
//         component={DashboardScreen}
//         options={{
//           title: "Trang chủ",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="home-outline" size={size} color={color} />
//           ),
//         }}
//       />

//       <Tab.Screen
//         name="Orders"
//         component={OrdersStack}
//         listeners={({ navigation }) => ({
//           tabPress: (e) => {
//             navigation.navigate("Orders", {
//               screen: "OrderList",
//             });
//           },
//         })}
//         options={{
//           title: "Đơn giao nhận",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="list-outline" size={size} color={color} />
//           ),
//           tabBarBadge: formatBadge(pendingOrdersCount),
//         }}
//       />

//       {user?.role === "QL" && (
//         <Tab.Screen
//           name="Logs"
//           component={ActivityLogStack}
//           options={{
//             title: "Lịch sử hoạt động",
//             tabBarIcon: ({ color, size }) => (
//               <Ionicons name="time-outline" size={size} color={color} />
//             ),  
//           }}
//         />
//       )}

//       <Tab.Screen
//         name="Notifications"
//         component={NotificationsStack}
//         options={{
//           title: "Thông báo",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="notifications-outline" size={size} color={color} />
//           ),
//           tabBarBadge: formatBadge(unreadCount),
//         }}
//       />

//       <Tab.Screen
//         name="Profile"
//         component={ProfileStack}
//         options={{
//           title: "Trang cá nhân",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="person-outline" size={size} color={color} />
//           ),
//         }}
//       />
//     </Tab.Navigator>
//   );
// }





// import React from "react";
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

// import DashboardScreen from "../screens/DashboardScreen";
// import OrderListScreen from "../screens/OrderListScreen";
// import ProfileScreen from "../screens/ProfileScreen";
// import { Ionicons } from "@expo/vector-icons";
// import useNotifications from "../hooks/useNotifications";
// import OrdersStack from "./OrdersStack";
// import NotificationScreen from "../screens/NotificationScreen";
// import NotificationsStack from "./NotificationsStack";
// import { useNotificationContext } from "../contexts/NotificationContext";
// import { useOrderContext } from "../contexts/OrderContext";
// import ActivityLogScreen from "../screens/ActivityLogScreen";
// import { useAuth } from "../contexts/AuthContext";
// import ActivityLogStack from "./ActivityLogStack";
// import ProfileStack from "./ProfileStack";
// import { CommonActions } from "@react-navigation/native";

// const Tab = createBottomTabNavigator();

// const formatBadge = (count: number) => {
//   if (!count) return undefined;
//   if (count > 99) return "99+";
//   return count;
// };

// export default function MainTabs() {
//   const { unreadCount } = useNotificationContext();
//   const { pendingOrdersCount } = useOrderContext();
//   const { user } = useAuth();

//   return (
//     <Tab.Navigator
//       screenOptions={{
//         headerShown: false,
//         tabBarActiveTintColor: "#2563eb",
//         tabBarBadgeStyle: {
//           backgroundColor: "#ef4444",
//           color: "white",
//           fontSize: 10,
//         },
//       }}
//     >
//       <Tab.Screen
//         name="Dashboard"
//         component={DashboardScreen}
//         options={{
//           title: "Trang chủ",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="home-outline" size={size} color={color} />
//           ),
//         }}
//       />

//       <Tab.Screen
//         name="Orders"
//         component={OrdersStack}
//         listeners={({ navigation }) => ({
//           tabPress: (e) => {
//             e.preventDefault(); // 🚨 chặn behavior mặc định

//             navigation.dispatch(
//               CommonActions.reset({
//                 index: 0,
//                 routes: [
//                   {
//                     name: "Orders",
//                     state: {
//                       routes: [{ name: "OrderList" }],
//                     },
//                   },
//                 ],
//               }),
//             );
//           },
//         })}
//         options={{
//           title: "Đơn giao nhận",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="list-outline" size={size} color={color} />
//           ),
//           tabBarBadge: formatBadge(pendingOrdersCount),
//         }}
//       />

//       {user?.role === "QL" && (
//         <Tab.Screen
//           name="Logs"
//           component={ActivityLogStack}
//           options={{
//             title: "Lịch sử hoạt động",
//             tabBarIcon: ({ color, size }) => (
//               <Ionicons name="time-outline" size={size} color={color} />
//             ),
//           }}
//         />
//       )}

//       <Tab.Screen
//         name="Notifications"
//         component={NotificationsStack}
//         options={{
//           title: "Thông báo",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="notifications-outline" size={size} color={color} />
//           ),
//           tabBarBadge: formatBadge(unreadCount),
//         }}
//       />

//       <Tab.Screen
//         name="Profile"
//         component={ProfileStack}
//         options={{
//           title: "Trang cá nhân",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="person-outline" size={size} color={color} />
//           ),
//         }}
//       />
//     </Tab.Navigator>
//   );
// }
