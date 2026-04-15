import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";

import { logoutStorage } from "../store/auth.store";
import { getAvatarColorById } from "../utils/avatar";
import { useAuth } from "../contexts/AuthContext";
import { EvilIcons } from "@expo/vector-icons";

export default function ProfileScreen({ navigation }: any) {
  const { user, setUser } = useAuth();

  const handleLogout = async () => {
    await logoutStorage();
    setUser(null);
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "QL":
        return "Trưởng phòng giao nhận";
      case "NVGN":
        return "Nhân viên giao nhận";
      default:
        return "USER";
    }
  };

  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : "?";
  const avatarColor = getAvatarColorById(user?.id);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* HEADER CARD */}
      <View style={styles.card}>
        {/* AVATAR */}
        <View style={styles.avatarWrapper}>
          <LinearGradient
            colors={["#2563eb", "#7c3aed", "#ec4899", "#f59e0b"]}
            style={styles.gradient}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatarFallback,
                  { backgroundColor: avatarColor },
                ]}
              >
                <Text style={styles.avatarText}>{firstLetter}</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* USER INFO */}
        <Text style={styles.name}>{user?.name || "Người dùng"}</Text>

        <Text style={styles.email}>{user?.email || "Không có email"}</Text>

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{getRoleLabel(user?.role)}</Text>
        </View>
      </View>

      {/* ACCOUNT ACTIONS */}
      <View style={styles.menuCard}>
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => navigation.navigate("ProfileDetail")}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconWrapper, { backgroundColor: "#eff6ff" }]}> 
              <EvilIcons name="user" size={22} color="#2563eb" />
            </View>
            <Text style={styles.menuText}>Thông tin tài khoản</Text>
          </View>
          <EvilIcons name="chevron-right" size={26} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => navigation.navigate("ChangePassword")}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconWrapper, { backgroundColor: "#f5f3ff" }]}>
              <EvilIcons name="lock" size={22} color="#7c3aed" />
            </View>
            <Text style={styles.menuText}>Đổi mật khẩu</Text>
          </View>
          <EvilIcons name="chevron-right" size={26} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItemLast}
          activeOpacity={0.7}
          onPress={() => navigation.navigate("GuideScreen")}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconWrapper, { backgroundColor: "#fff7ed" }]}>
              <EvilIcons name="question" size={22} color="#f59e0b" />
            </View>
            <Text style={styles.menuText}>Hướng dẫn sử dụng</Text>
          </View>
          <EvilIcons name="chevron-right" size={26} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* LOGOUT */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  avatarWrapper: {
    marginBottom: 14,
  },

  gradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },

  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },

  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#fff",
  },

  name: {
    fontSize: 22,
    fontWeight: "700",
  },

  email: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },

  roleBadge: {
    marginTop: 10,
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },

  roleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  menuCard: {
    marginTop: 20,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 6,

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingVertical: 16,
    paddingHorizontal: 18,

    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  menuItemLast: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingVertical: 16,
    paddingHorizontal: 18,
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  menuText: {
    fontSize: 15.5,
    fontWeight: "500",
    color: "#111827",
    marginLeft: 12,
  },

  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },

  logoutButton: {
    marginTop: 24,
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
