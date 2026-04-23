import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";

import { logoutStorage } from "../store/auth.store";
import { getAvatarColorById } from "../utils/avatar";
import { useAuth } from "../contexts/AuthContext";
import { EvilIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

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
            <EvilIcons name="envelope" size={16} color="#94a3b8" />
            <Text style={styles.userEmail}>{user?.email || "Không có email"}</Text>
          </View>

          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.roleContainer}
          >
            <Text style={styles.roleLabel}>{user?.position || "Nhân viên"}</Text>
          </LinearGradient>
        </View>
      </View>

      {/* MENU SECTION */}
      <View style={styles.menuContainer}>
        <Text style={styles.menuHeader}>TÀI KHOẢN</Text>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.6}
          onPress={() => navigation.navigate("ProfileDetail")}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconContainer, { backgroundColor: "#e0e7ff" }]}>
              <EvilIcons name="user" size={24} color="#4f46e5" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Thông tin cá nhân</Text>
              <Text style={styles.menuItemSubtitle}>Xem và chỉnh sửa thông tin</Text>
            </View>
          </View>
          <EvilIcons name="chevron-right" size={28} If="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.6}
          onPress={() => navigation.navigate("ChangePassword")}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconContainer, { backgroundColor: "#f3e8ff" }]}>
              <EvilIcons name="lock" size={24} color="#9333ea" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Bảo mật</Text>
              <Text style={styles.menuItemSubtitle}>Đổi mật khẩu đăng nhập</Text>
            </View>
          </View>
          <EvilIcons name="chevron-right" size={28} If="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.menuItemLast]}
          activeOpacity={0.6}
          onPress={() => navigation.navigate("GuideScreen")}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconContainer, { backgroundColor: "#fef3c7" }]}>
              <EvilIcons name="question" size={24} color="#d97706" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Hỗ trợ</Text>
              <Text style={styles.menuItemSubtitle}>Hướng dẫn sử dụng ứng dụng</Text>
            </View>
          </View>
          <EvilIcons name="chevron-right" size={28} If="#cbd5e1" />
        </TouchableOpacity>
      </View>

      {/* LOGOUT BUTTON */}
      <TouchableOpacity 
        style={styles.logoutButton} 
        activeOpacity={0.8}
        onPress={handleLogout}
      >
        <LinearGradient
          colors={["#ef4444", "#dc2626"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.logoutGradient}
        >
          <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* VERSION INFO */}
      <Text style={styles.versionText}>Phiên bản 2.0.3.1</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Background decoration
  backgroundDecoration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    overflow: "hidden",
  },

  circle1: {
    position: "absolute",
    top: -50,
    right: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(102, 126, 234, 0.1)",
  },

  circle2: {
    position: "absolute",
    top: 50,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(118, 75, 162, 0.08)",
  },

  circle3: {
    position: "absolute",
    bottom: 20,
    right: 30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(240, 147, 251, 0.06)",
  },

  // Profile Card
  profileCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#667eea",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },

  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },

  avatarGradient: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#667eea",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#ffffff",
  },

  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
  },

  avatarInitial: {
    fontSize: 42,
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
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
    letterSpacing: -0.3,
  },

  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  userEmail: {
    fontSize: 13,
    color: "#64748b",
    marginLeft: 6,
    fontWeight: "500",
  },

  roleContainer: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: "#667eea",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  roleLabel: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // Menu Section
  menuContainer: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },

  menuHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 1.2,
    marginLeft: 16,
    marginTop: 12,
    marginBottom: 8,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
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
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  menuItemContent: {
    flex: 1,
  },

  menuItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },

  menuItemSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },

  // Logout Button
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#ef4444",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },

  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },

  logoutIcon: {
    marginRight: 8,
  },

  logoutText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Version
  versionText: {
    textAlign: "center",
    fontSize: 11,
    color: "#cbd5e1",
    marginTop: 20,
    fontWeight: "500",
  },
});