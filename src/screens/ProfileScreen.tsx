// ProfileScreen.tsx
import React, { useCallback, useEffect, useState } from "react";
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
  Modal,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

import { logoutStorage } from "../store/auth.store";
import { getAvatarColorById } from "../utils/avatar";
import { useAuth } from "../contexts/AuthContext";
import { EvilIcons, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { settingService } from "../services/setting.service";
import { useFocusEffect } from "@react-navigation/native";
import { usersService } from "../services/user.service";

const { width, height } = Dimensions.get("window");
const isTablet = width >= 768;

export default function ProfileScreen({ navigation }: any) {
  const { user, setUser, refreshAvatar, reloadUser } = useAuth();
  const [showDemoButton, setShowDemoButton] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [fullImageModalVisible, setFullImageModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    loadSettings();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
      refreshAvatar();
    }, []),
  );

  const loadSettings = async () => {
    try {
      const res = await settingService.getSystemSettingsApi();
      const showDemo = res?.data?.show_demo_lookup === "1";
      setShowDemoButton(showDemo);
    } catch (err) {
      console.log(err);
    }
  };

  // Chọn ảnh từ thư viện hoặc camera
  const pickImage = async (useCamera: boolean = false) => {
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Lỗi", "Bạn cần cấp quyền để chọn ảnh");
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: false,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: false,
          });

      if (!result.canceled && result.assets[0]) {
        // Resize ảnh trước khi upload
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 500, height: 500 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
        );

        uploadAvatar(manipulatedImage.uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại!");
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", {
        uri: imageUri,
        type: "image/jpeg",
        name: `avatar_${user?.id}_${Date.now()}.jpg`,
      } as any);

      const response = await usersService.uploadAvatar(formData);

      if (response?.success) {
        // Refresh avatar từ server thay vì dùng URL trả về
        const newAvatarUrl = await refreshAvatar();

        Alert.alert("Thành công", "Cập nhật ảnh đại diện thành công!");
        setAvatarModalVisible(false);
      } else {
        Alert.alert("Lỗi", response?.error || "Upload ảnh thất bại");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      Alert.alert("Lỗi", error?.message || "Có lỗi xảy ra khi upload ảnh");
    } finally {
      setUploading(false);
    }
  };

  // const deleteAvatar = async () => {
  //   Alert.alert(
  //     "Xác nhận xóa",
  //     "Bạn có chắc chắn muốn xóa ảnh đại diện?",
  //     [
  //       { text: "Hủy", style: "cancel" },
  //       {
  //         text: "Xóa",
  //         style: "destructive",
  //         onPress: async () => {
  //           setDeleting(true);
  //           try {
  //             const response = await usersService.deleteAvatar();
  //             if (response?.success) {
  //               // Refresh avatar từ server
  //               await refreshAvatar();
  //               Alert.alert("Thành công", "Xóa ảnh đại diện thành công!");
  //               setAvatarModalVisible(false);
  //             } else {
  //               Alert.alert("Lỗi", response?.error || "Xóa ảnh thất bại");
  //             }
  //           } catch (error: any) {
  //             console.error("Delete error:", error);
  //             Alert.alert("Lỗi", error?.message || "Có lỗi xảy ra khi xóa ảnh");
  //           } finally {
  //             setDeleting(false);
  //           }
  //         },
  //       },
  //     ],
  //     { cancelable: true },
  //   );
  // };

  const deleteAvatar = () => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa ảnh đại diện?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const response = await usersService.deleteAvatar();
              if (response?.success) {
                // Refresh avatar từ server
                await refreshAvatar();
                setAvatarModalVisible(false);
                // Đợi modal đóng rồi mới hiện alert và reset state
                setTimeout(() => {
                  Alert.alert("Thành công", "Xóa ảnh đại diện thành công!");
                  setDeleting(false);
                }, 100);
              } else {
                Alert.alert("Lỗi", response?.error || "Xóa ảnh thất bại");
                setDeleting(false);
              }
            } catch (error: any) {
              console.error("Delete error:", error);
              Alert.alert("Lỗi", error?.message || "Có lỗi xảy ra khi xóa ảnh");
              setDeleting(false);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : "?";
  const avatarColor = getAvatarColorById(user?.id);

  // Avatar Modal Component
  const AvatarActionModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={avatarModalVisible}
      onRequestClose={() => setAvatarModalVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setAvatarModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ảnh đại diện</Text>
                <TouchableOpacity
                  onPress={() => setAvatarModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Avatar Preview */}
              <View style={styles.modalAvatarContainer}>
                {user?.avatar ? (
                  <TouchableOpacity
                    onPress={() => {
                      setAvatarModalVisible(false);
                      setFullImageModalVisible(true);
                    }}
                  >
                    <Image
                      source={{ uri: user.avatar }}
                      style={styles.modalAvatar}
                    />
                    <View style={styles.viewFullImageBadge}>
                      <Text style={styles.viewFullImageText}>Xem ảnh gốc</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View
                    style={[
                      styles.modalAvatar,
                      styles.modalAvatarPlaceholder,
                      { backgroundColor: avatarColor },
                    ]}
                  >
                    <Text style={styles.modalAvatarInitial}>{firstLetter}</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cameraButton]}
                  onPress={() => pickImage(true)}
                  disabled={uploading}
                >
                  <Ionicons name="camera" size={22} color="#ffffff" />
                  <Text style={styles.modalButtonText}>Chụp ảnh</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.galleryButton]}
                  onPress={() => pickImage(false)}
                  disabled={uploading}
                >
                  <Ionicons name="images" size={22} color="#ffffff" />
                  <Text style={styles.modalButtonText}>Chọn từ thư viện</Text>
                </TouchableOpacity>

                {user?.avatar && (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.deleteButton]}
                    onPress={deleteAvatar}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <MaterialIcons
                          name="delete"
                          size={22}
                          color="#ffffff"
                        />
                        <Text style={styles.modalButtonText}>Xóa ảnh</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {(uploading || deleting) && (
                <View style={styles.loadingOverlay} pointerEvents="auto">
                  <ActivityIndicator size="large" color="#667eea" />
                  <Text style={styles.loadingText}>
                    {uploading ? "Đang tải lên..." : "Đang xóa..."}
                  </Text>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // Full Image Modal
  const FullImageModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={fullImageModalVisible}
      onRequestClose={() => setFullImageModalVisible(false)}
    >
      <View style={styles.fullImageOverlay}>
        <TouchableOpacity
          style={styles.fullImageCloseButton}
          onPress={() => setFullImageModalVisible(false)}
        >
          <Ionicons name="close" size={28} color="#ffffff" />
        </TouchableOpacity>
        {user?.avatar && (
          <Image
            source={{ uri: user.avatar }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        )}
      </View>
    </Modal>
  );

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
          {/* AVATAR SECTION - CLICKABLE */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => setAvatarModalVisible(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#667eea", "#764ba2", "#f093fb", "#f5576c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              {user?.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.avatarImage}
                />
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
            <View style={styles.editAvatarBadge}>
              <MaterialIcons
                name="edit"
                size={isTablet ? 16 : 14}
                color="#ffffff"
              />
            </View>
          </TouchableOpacity>

          {/* USER DETAILS */}
          <View style={styles.userInfoContainer}>
            <Text style={styles.userName}>{user?.name || "Người dùng"}</Text>

            <View style={styles.emailContainer}>
              <EvilIcons
                name="envelope"
                size={isTablet ? 16 : 14}
                color="#94a3b8"
              />
              <Text style={styles.userEmail}>
                {user?.email || "Không có email"}
              </Text>
            </View>
            {!showDemoButton && (
              <View style={styles.roleContainer}>
                <Ionicons
                  name="shield-checkmark"
                  size={14}
                  color="#2563eb"
                  style={{ marginRight: 6 }}
                />

                <Text
                  style={styles.roleLabel}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {user?.position || "Nhân viên"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* MENU SECTION */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuHeader}>THÔNG TIN</Text>

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.6}
            onPress={() => navigation.navigate("ChangePassword")}
          >
            <View style={styles.menuItemLeft}>
              <View
                style={[styles.iconContainer, { backgroundColor: "#f3e8ff" }]}
              >
                <EvilIcons
                  name="lock"
                  size={isTablet ? 24 : 20}
                  color="#9333ea"
                />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Bảo mật</Text>
                <Text style={styles.menuItemSubtitle}>
                  Đổi mật khẩu đăng nhập
                </Text>
              </View>
            </View>
            <EvilIcons
              name="chevron-right"
              size={isTablet ? 28 : 24}
              color="#cbd5e1"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemLast]}
            activeOpacity={0.6}
            onPress={() => navigation.navigate("GuideScreen")}
          >
            <View style={styles.menuItemLeft}>
              <View
                style={[styles.iconContainer, { backgroundColor: "#fef3c7" }]}
              >
                <EvilIcons
                  name="question"
                  size={isTablet ? 24 : 20}
                  color="#d97706"
                />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Hỗ trợ</Text>
                <Text style={styles.menuItemSubtitle}>
                  Hướng dẫn sử dụng ứng dụng
                </Text>
              </View>
            </View>
            <EvilIcons
              name="chevron-right"
              size={isTablet ? 28 : 24}
              color="#cbd5e1"
            />
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
        <Text style={styles.versionText}>Phiên bản 2.0.12</Text>
      </ScrollView>

      {/* Modals */}
      <AvatarActionModal />
      <FullImageModal />
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
    position: "relative",
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

  editAvatarBadge: {
    position: "absolute",
    bottom: isTablet ? 2 : 0,
    right: isTablet ? width * 0.18 : 20,
    backgroundColor: "#667eea",
    borderRadius: 20,
    padding: isTablet ? 6 : 4,
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    shadowColor: "#2563eb",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },

  roleLabel: {
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
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

  logoutText: {
    color: "#ffffff",
    fontSize: isTablet ? 18 : 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
  },

  // Version
  versionText: {
    textAlign: "center",
    fontSize: isTablet ? 12 : 10,
    color: "#cbd5e1",
    marginTop: 16,
    fontWeight: "500",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: height * 0.4,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },

  modalCloseButton: {
    padding: 4,
  },

  modalAvatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },

  modalAvatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: "#e2e8f0",
  },

  modalAvatarPlaceholder: {
    backgroundColor: "#667eea",
    justifyContent: "center",
    alignItems: "center",
  },

  modalAvatarInitial: {
    fontSize: 60,
    fontWeight: "800",
    color: "#ffffff",
  },

  viewFullImageBadge: {
    position: "absolute",
    bottom: 5,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: "center",
  },

  viewFullImageText: {
    color: "#ffffff",
    fontSize: 10,
    textAlign: "center",
  },

  modalActions: {
    gap: 12,
  },

  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },

  cameraButton: {
    backgroundColor: "#10b981",
  },

  galleryButton: {
    backgroundColor: "#3b82f6",
  },

  deleteButton: {
    backgroundColor: "#ef4444",
  },

  modalButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  // loadingOverlay: {
  //   position: "absolute",
  //   top: 0,
  //   left: 0,
  //   right: 0,
  //   bottom: 0,
  //   backgroundColor: "rgba(255, 255, 255, 0.9)",
  //   justifyContent: "center",
  //   alignItems: "center",
  //   borderRadius: 24,
  // },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
    zIndex: 9999,
    elevation: 9999,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#667eea",
    fontWeight: "500",
  },

  fullImageOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },

  fullImageCloseButton: {
    position: "absolute",
    top: 48,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 30,
    padding: 8,
  },

  fullImage: {
    width: width,
    height: height * 0.7,
  },
});
