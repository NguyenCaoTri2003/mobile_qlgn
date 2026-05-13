import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";

import { logoutStorage } from "../store/auth.store";
import { getAvatarColorById } from "../utils/avatar";
import { useAuth } from "../contexts/AuthContext";
import { EvilIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function ProfileScreen({ navigation }: any) {
  const { user, setUser } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Xác nhận đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất không?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            await logoutStorage();
            setUser(null);
          },
        },
      ],
      { cancelable: true },
    );
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "QL":
        return "Trưởng phòng giao nhận";
      case "NVGN":
        return "Nhân viên giao nhận";
      default:
        return "Nhân viên";
    }
  };

  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : "?";
  const avatarColor = getAvatarColorById(user?.id);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* BACKGROUND DECORATION */}
        <View style={styles.backgroundDecoration}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />
        </View>

        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          {/* AVATAR SECTION */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={["#667eea", "#764ba2", "#f093fb", "#f5576c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: avatarColor },
                  ]}
                >
                  <Text style={styles.avatarInitial}>{firstLetter}</Text>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* USER DETAILS */}
          <View style={styles.userInfoContainer}>
            <Text style={styles.userName}>{user?.name || "Người dùng"}</Text>
            
            <View style={styles.emailContainer}>
              <EvilIcons name="envelope" size={isTablet ? 16 : 14} color="#94a3b8" />
              <Text style={styles.userEmail}>{user?.email || "Không có email"}</Text>
            </View>

          {/* <LinearGradient
                        colors={["#667eea", "#764ba2"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.roleContainer}
                      >
                        <Text style={styles.roleLabel} numberOfLines={1} ellipsizeMode="tail">
                          {getRoleLabel(user?.position) || "Nhân viên"}
                        </Text>
                      </LinearGradient> */}
          </View>
        </View>

        {/* MENU SECTION */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuHeader}>TÀI KHOẢN</Text>

          {/* <TouchableOpacity
                      style={styles.menuItem}
                      activeOpacity={0.6}
                      onPress={() => navigation.navigate("ProfileDetail")}
                    >
                      <View style={styles.menuItemLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: "#e0e7ff" }]}>
                          <EvilIcons name="user" size={isTablet ? 24 : 20} color="#4f46e5" />
                        </View>
                        <View style={styles.menuItemContent}>
                          <Text style={styles.menuItemTitle}>Thông tin cá nhân</Text>
                          <Text style={styles.menuItemSubtitle}>Xem và chỉnh sửa thông tin</Text>
                        </View>
                      </View>
                      <EvilIcons name="chevron-right" size={isTablet ? 28 : 24} color="#cbd5e1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuItem}
                      activeOpacity={0.6}
                      onPress={() => navigation.navigate("ChangePassword")}
                    >
                      <View style={styles.menuItemLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: "#f3e8ff" }]}>
                          <EvilIcons name="lock" size={isTablet ? 24 : 20} color="#9333ea" />
                        </View>
                        <View style={styles.menuItemContent}>
                          <Text style={styles.menuItemTitle}>Bảo mật</Text>
                          <Text style={styles.menuItemSubtitle}>Đổi mật khẩu đăng nhập</Text>
                        </View>
                      </View>
                      <EvilIcons name="chevron-right" size={isTablet ? 28 : 24} color="#cbd5e1" />
                    </TouchableOpacity> */}

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemLast]}
            activeOpacity={0.6}
            onPress={() => navigation.navigate("GuideScreen")}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: "#fef3c7" }]}>
                <EvilIcons name="question" size={isTablet ? 24 : 20} color="#d97706" />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Hỗ trợ</Text>
                <Text style={styles.menuItemSubtitle}>Hướng dẫn sử dụng ứng dụng</Text>
              </View>
            </View>
            <EvilIcons name="chevron-right" size={isTablet ? 28 : 24} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
            <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
        
        </TouchableOpacity>

        {/* VERSION INFO */}
        <Text style={styles.versionText}>Phiên bản 1.1.4</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
    alignItems: isTablet ? "center" : "stretch",
  },

  // Background decoration
  backgroundDecoration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 240,
    overflow: "hidden",
  },

  circle1: {
    position: "absolute",
    top: -40,
    right: -25,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(102, 126, 234, 0.1)",
  },

  circle2: {
    position: "absolute",
    top: 40,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(118, 75, 162, 0.08)",
  },

  circle3: {
    position: "absolute",
    bottom: 15,
    right: 25,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(240, 147, 251, 0.06)",
  },

  // Profile Card
  profileCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: isTablet ? width * 0.15 : 16,
    marginTop: 16,
    borderRadius: 20,
    padding: isTablet ? 30 : 20,
    width: isTablet ? width * 0.7 : undefined,
    maxWidth: isTablet ? 500 : undefined,
    shadowColor: "#667eea",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },

  avatarContainer: {
    alignItems: "center",
    marginBottom: isTablet ? 20 : 16,
  },

  avatarGradient: {
    width: isTablet ? 110 : 90,
    height: isTablet ? 110 : 90,
    borderRadius: isTablet ? 55 : 45,
    padding: 2.5,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#667eea",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: isTablet ? 55 : 45,
    borderWidth: 2.5,
    borderColor: "#ffffff",
  },

  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: isTablet ? 55 : 45,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "#ffffff",
  },

  avatarInitial: {
    fontSize: isTablet ? 42 : 34,
    fontWeight: "800",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  userInfoContainer: {
    alignItems: "center",
  },

  userName: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 6,
    letterSpacing: -0.3,
  },

  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },

  userEmail: {
    fontSize: isTablet ? 13 : 11,
    color: "#64748b",
    marginLeft: 6,
    fontWeight: "500",
  },

  roleContainer: {
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: isTablet ? 10 : 8,
    borderRadius: 20,
    minWidth: isTablet ? 200 : 140,
    alignSelf: "center",
    shadowColor: "#667eea",
    shadowOffset: {
      width: 0,
      height: 1.5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  roleLabel: {
    color: "#ffffff",
    fontSize: isTablet ? 14 : 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textAlign: "center",
  },

  // Menu Section
  menuContainer: {
    backgroundColor: "#ffffff",
    marginHorizontal: isTablet ? width * 0.15 : 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 6,
    width: isTablet ? width * 0.7 : undefined,
    maxWidth: isTablet ? 500 : undefined,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1.5,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },

  menuHeader: {
    fontSize: isTablet ? 13 : 11,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 1,
    marginLeft: 14,
    marginTop: 10,
    marginBottom: 6,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: isTablet ? 16 : 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  menuItemLast: {
    borderBottomWidth: 0,
  },

  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  iconContainer: {
    width: isTablet ? 48 : 42,
    height: isTablet ? 48 : 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  menuItemContent: {
    flex: 1,
  },

  menuItemTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },

  menuItemSubtitle: {
    fontSize: isTablet ? 13 : 11,
    color: "#94a3b8",
    fontWeight: "500",
  },

  // Logout Button
  logoutButton: {
    marginHorizontal: isTablet ? width * 0.15 : 16,
    marginTop: 20,
    borderRadius: 12,
    width: isTablet ? width * 0.7 : undefined,
    maxWidth: isTablet ? 500 : undefined,
    shadowColor: "#ef4444",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
      height: 48,
          justifyContent: "center",
          alignItems: "center",
    backgroundColor: "#dc2626",
  },

  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: isTablet ? 18 : 16,
    paddingHorizontal: isTablet ? 30 : 24,
    borderRadius: 12,
    minHeight: isTablet ? 56 : 48,
  },

  logoutIcon: {
    marginRight: 8,
  },

  logoutText: {
    color: "#ffffff",
    fontSize: isTablet ? 18 : 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
    flexShrink: 0,
  },

  // Version
  versionText: {
    textAlign: "center",
    fontSize: isTablet ? 12 : 10,
    color: "#cbd5e1",
    marginTop: 16,
    fontWeight: "500",
  },
});
