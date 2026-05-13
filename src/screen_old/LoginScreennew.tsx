import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";

import { loginApi } from "../api/auth.api";
import { saveUser } from "../store/auth.store";
import { useAuth } from "../contexts/AuthContext";

const { width, height } = Dimensions.get("window");

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showPass, setShowPass] = useState(false);
  const { setUser, reloadUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setIsKeyboardVisible(true);
        
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();

        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false);
        
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [slideAnim]);

  const onLogin = async () => {
    if (!email || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await loginApi(email, password);

      const user = res.data.user;
      const role = user.role;

      if (!["QL", "NVGN"].includes(role)) {
        setErrorMsg("Tài khoản không có quyền truy cập");
        return;
      }

      await saveUser(res.data.user, res.data.token, res.data.nhigia_expired);

      setUser(res.data.user);
      await reloadUser();
    } catch (err) {
      console.log(err);
      setErrorMsg("Sai thông tin đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30],
  });
  
  return (
    <View style={styles.mainContainer}>
      <View style={styles.backgroundDecoration}>
        <LinearGradient
          colors={["#1e3a8a", "#3b82f6"]}
          style={styles.gradientCircle1}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={["#60a5fa", "#2563eb"]}
          style={styles.gradientCircle2}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.blurCircle1} />
        <View style={styles.blurCircle2} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={[
              styles.scrollContainer,
              isKeyboardVisible && styles.scrollContainerKeyboard
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View 
              style={[
                styles.container,
                {
                  transform: [{ translateY }]
                }
              ]}
            >
              <View style={styles.card}>
                <View style={styles.logoBanner}>
                    <Image
                      source={require("../../assets/images/logo/logo-main.png")}
                      style={styles.logoImg}
                    />
                </View>

                <View style={styles.welcomeContainer}>
                  <LinearGradient
                    colors={["#1e3a8a", "#2563eb", "#3b82f6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.titleGradient}
                  >
                    <Text style={styles.welcomeTitle}>NHỊ GIA LOGISTICS</Text>
                  </LinearGradient>
                  <View style={styles.subtitleWrapper}>
                    <View style={styles.subtitleLine} />
                    <Text style={styles.welcomeSubtitle}>Hệ thống quản lý giao nhận</Text>
                    <View style={styles.subtitleLine} />
                  </View>
                </View>

                {errorMsg ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={14} color="#ef4444" />
                    <Text style={styles.error}>{errorMsg}</Text>
                  </View>
                ) : null}

                {/* Form Section */}
                <View style={styles.formContainer}>
                  {/* Email Input */}
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <View style={[styles.inputBox, email && styles.inputBoxFocused]}>
                      <Ionicons 
                        name="mail-outline" 
                        size={16} 
                        color={email ? "#2563eb" : "#94a3b8"} 
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="email@nhigia.vn"
                        placeholderTextColor="#94a3b8"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Mật khẩu</Text>
                    <View style={[styles.inputBox, password && styles.inputBoxFocused]}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={16}
                        color={password ? "#2563eb" : "#94a3b8"}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Nhập mật khẩu"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry={!showPass}
                        value={password}
                        onChangeText={setPassword}
                      />
                      <TouchableOpacity 
                        onPress={() => setShowPass(!showPass)}
                        style={styles.eyeButton}
                      >
                        <Ionicons
                          name={showPass ? "eye-off-outline" : "eye-outline"}
                          size={16}
                          color="#94a3b8"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.buttonWrapper}
                    onPress={onLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={["#2563eb", "#1e3a8a"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.button, loading && styles.buttonDisabled]}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Text style={styles.buttonText}>Đăng nhập</Text>
                          <Ionicons name="arrow-forward" size={16} color="#fff" style={styles.buttonIcon} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.footer}>
                <Text style={styles.version}>Phiên bản 2.0.4</Text>
                <Text style={styles.copyright}>© 2026 Nhị Gia Logistics</Text>
              </View>
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  backgroundDecoration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    zIndex: 0,
  },
  gradientCircle1: {
    position: "absolute",
    top: -120,
    right: -120,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.12,
  },
  gradientCircle2: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.1,
  },
  blurCircle1: {
    position: "absolute",
    top: "30%",
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#3b82f6",
    opacity: 0.06,
  },
  blurCircle2: {
    position: "absolute",
    bottom: "20%",
    right: -20,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#60a5fa",
    opacity: 0.05,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  scrollContainerKeyboard: {
    justifyContent: "flex-start",
    paddingTop: 30,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 20,
    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 15,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.1)",
    zIndex: 1,
  },
  logoBanner: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    marginBottom: 8,
  },
  logoImg: {
    width: width * 0.45,
    height: width * 0.28,
    resizeMode: "contain",
  },
  welcomeContainer: {
    marginBottom: 18,
    alignItems: "center",
  },
  titleGradient: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 30,
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 1.5,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  subtitleLine: {
    width: 24,
    height: 1.5,
    backgroundColor: "#3b82f6",
    borderRadius: 1,
    opacity: 0.5,
  },
  welcomeSubtitle: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  error: {
    color: "#dc2626",
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  formContainer: {
    marginTop: 2,
  },
  inputWrapper: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 5,
    letterSpacing: 0.3,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    backgroundColor: "#fafbfc",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  inputBoxFocused: {
    borderColor: "#2563eb",
    backgroundColor: "#ffffff",
    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "500",
  },
  eyeButton: {
    padding: 3,
  },
  buttonWrapper: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 6,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 6,
  },
  footer: {
    alignItems: "center",
    marginTop: 16,
  },
  version: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "500",
    marginBottom: 3,
  },
  copyright: {
    fontSize: 10,
    color: "#cbd5e1",
    fontWeight: "400",
  },
});