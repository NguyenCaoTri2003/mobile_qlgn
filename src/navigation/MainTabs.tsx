import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";

import DashboardScreen from "../screens/DashboardScreen";
import OrdersStack from "./OrdersStack";
import NotificationsStack from "./NotificationsStack";
import ActivityLogStack from "./ActivityLogStack";
import ProfileStack from "./ProfileStack";

import { useNotificationContext } from "../contexts/NotificationContext";
import { useOrderContext } from "../contexts/OrderContext";
import { useAuth } from "../contexts/AuthContext";

const Tab = createBottomTabNavigator();

const formatBadge = (count: number) => {
  if (!count) return undefined;
  if (count > 99) return "99+";
  return count;
};

// Custom Tab Icon với style đẹp hơn
const TabIcon = ({ 
  name, 
  focused, 
  color,
  badge 
}: { 
  name: string; 
  focused: boolean; 
  color: string;
  badge?: number;
}) => {
  const iconName = focused ? name.replace("-outline", "") : name;
  
  return (
    <View style={styles.iconContainer}>
      <View style={[
        styles.iconBackground,
        focused && styles.iconBackgroundActive
      ]}>
        <Ionicons 
          name={iconName as any} 
          size={focused ? 24 : 22} 
          color={focused ? "#2563eb" : "#94a3b8"} 
        />
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={[styles.badgeContainer, { minWidth: badge > 99 ? 34 : 24 }]}>
          <Text style={styles.badgeText}>
            {badge > 99 ? "99+" : badge}
          </Text>
        </View>
      )}
    </View>
  );
};

// Custom Tab Label
const TabLabel = ({ label, focused }: { label: string; focused: boolean }) => {
  return (
    <Text style={[
      styles.tabLabel,
      focused ? styles.tabLabelActive : styles.tabLabelInactive
    ]}>
      {label}
    </Text>
  );
};

export default function MainTabs() {
  const { unreadCount } = useNotificationContext();
  const { pendingOrdersCount } = useOrderContext();
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarBadgeStyle: { display: "none" }, // Tắt badge mặc định
        tabBarShowLabel: true,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home-outline" focused={focused} color="" />
          ),
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Trang chủ" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Orders"
        component={OrdersStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();

            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [
                  {
                    name: "Orders",
                    state: {
                      routes: [{ name: "OrderList" }],
                    },
                  },
                ],
              })
            );
          },
        })}
        options={{
          title: "Đơn hàng",
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              name="cube-outline" 
              focused={focused} 
              color="" 
              badge={pendingOrdersCount}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Đơn hàng" focused={focused} />
          ),
        }}
      />

      {user?.role === "QL" && (
        <Tab.Screen
          name="Logs"
          component={ActivityLogStack}
          options={{
            title: "Hoạt động",
            tabBarIcon: ({ focused }) => (
              <TabIcon name="time-outline" focused={focused} color="" />
            ),
            tabBarLabel: ({ focused }) => (
              <TabLabel label="Hoạt động" focused={focused} />
            ),
          }}
        />
      )}

      <Tab.Screen
        name="Notifications"
        component={NotificationsStack}
        options={{
          title: "Thông báo",
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              name="notifications-outline" 
              focused={focused} 
              color="" 
              badge={unreadCount}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Thông báo" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          title: "Cá nhân",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person-outline" focused={focused} color="" />
          ),
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Cá nhân" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    // height: Platform.OS === "ios" ? 88 : 85,
    paddingTop: 10,
    // paddingBottom: Platform.OS === "ios" ? 28 : 10,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 10,
  },

  tabBarLabel: {
    display: "none", // Ẩn label mặc định, dùng custom label
  },

  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
    letterSpacing: -0.2,
  },

  tabLabelActive: {
    color: "#0051ff",
    fontWeight: "600",
  },

  tabLabelInactive: {
    color: "#94a3b8",
  },

  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  iconBackground: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    // transition: "all 0.2s",
  },

  iconBackgroundActive: {
    backgroundColor: "#eff6ff",
  },

  badgeContainer: {
    position: "absolute",
    top: -2,
    right: -8,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 2.5,
    borderColor: "#ffffff",
    shadowColor: "#ef4444",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 999,
  },

  badgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 15,
    includeFontPadding: false,
  },
});