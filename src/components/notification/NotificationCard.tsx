import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function NotificationCard({ item, onPress, index }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  const isUnread = item.read_status === 0;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        delay: index * 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        delay: index * 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const getNotificationIcon = () => {
    if (item.type === "order_update") return "cube-outline";
    if (item.type === "payment") return "card-outline";
    if (item.type === "promotion") return "pricetag-outline";
    return "notifications-outline";
  };

  const getNotificationColor = () => {
    if (item.type === "order_update") return "#3B82F6";
    if (item.type === "payment") return "#10B981";
    if (item.type === "promotion") return "#F59E0B";
    return "#64748B";
  };

  const iconColor = getNotificationColor();

  return (
    <Pressable 
      onPress={onPress} 
      onPressIn={pressIn} 
      onPressOut={pressOut}
      style={styles.pressableContainer}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              { scale },
              { translateY }
            ],
            opacity,
          },
          isUnread && styles.cardUnread,
        ]}
      >
        {/* Left border indicator for unread - Gradient */}
        {isUnread && (
          <LinearGradient
            colors={["#3B82F6", "#60A5FA", "#3B82F6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.unreadBorder}
          />
        )}

        {/* Icon Container */}
        <View style={styles.iconWrapper}>
          <LinearGradient
            colors={isUnread 
              ? ["#3B82F6", "#2563EB"] 
              : ["#F8FAFC", "#F1F5F9"]}
            style={styles.iconGradient}
          >
            <Ionicons
              name={getNotificationIcon()}
              size={18}
              color={isUnread ? "#FFFFFF" : "#94A3B8"}
            />
          </LinearGradient>
          
          {isUnread && (
            <View style={styles.unreadIndicator}>
              <View style={styles.unreadIndicatorInner} />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <View style={styles.messageRow}>
            <Text 
              style={[
                styles.message,
                isUnread && styles.messageUnread
              ]}
              numberOfLines={2}
            >
              {item.message}
            </Text>
            
            {isUnread && (
              <LinearGradient
                colors={["#3B82F6", "#2563EB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.newBadge}
              >
                <Text style={styles.newBadgeText}>Mới</Text>
              </LinearGradient>
            )}
          </View>
          
          <View style={styles.metaRow}>
            <View style={styles.timeContainer}>
              <Ionicons 
                name="time-outline" 
                size={10} 
                color={isUnread ? "#3B82F6" : "#94A3B8"} 
              />
              <Text style={[styles.time, isUnread && styles.timeUnread]}>
                {item.time}
              </Text>
            </View>
          </View>
        </View>

        {/* Chevron */}
        <View style={[
          styles.chevronContainer, 
          isUnread && styles.chevronContainerUnread
        ]}>
          <Ionicons 
            name="chevron-forward" 
            size={14} 
            color={isUnread ? "#3B82F6" : "#CBD5E1"} 
          />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressableContainer: {
    marginHorizontal: 12,
    marginVertical: 3,
  },
  
  card: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    position: "relative",
    overflow: "hidden",
  },
  
  cardUnread: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    shadowColor: "#3B82F6",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  
  // Unread left border indicator - Gradient
  unreadBorder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  
  // Icon Styles
  iconWrapper: {
    position: "relative",
    marginRight: 12,
  },
  iconGradient: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  unreadIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  unreadIndicatorInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#3B82F6",
  },
  
  // Content Styles
  contentContainer: {
    flex: 1,
    marginRight: 6,
  },
  
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    gap: 6,
  },
  
  message: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#475569",
  },
  
  messageUnread: {
    color: "#1E293B",
    fontWeight: "600",
  },
  
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
  
  newBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  
  // Meta Row
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  
  time: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  
  timeUnread: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  
  // Chevron
  chevronContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  
  chevronContainerUnread: {
    backgroundColor: "#DBEAFE",
  },
});