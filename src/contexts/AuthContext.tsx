import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { authService } from "../services/auth.service";
import {
  isNhigiaExpired,
  isTokenExpired,
  logoutStorage,
  saveUser,
} from "../store/auth.store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import SessionExpiredModal from "../components/SessionExpiredModal";
import { usersService } from "../services/user.service";
import { BE_URL } from "../constants/api";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const logoutTimer = useRef<any>(null);
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  const handleLogout = () => {
    setShowExpiredModal(true);
  };

  const confirmLogout = async () => {
    setShowExpiredModal(false);
    await logoutStorage();
    setUser(null);
    setToken(null);
  };

  const startLogoutTimer = (expiredTime: string) => {
    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
    }

    const timeout = new Date(expiredTime).getTime() - Date.now();

    if (timeout <= 0) {
      handleLogout();
      return;
    }

    logoutTimer.current = setTimeout(() => {
      handleLogout();
    }, timeout);
  };

  const refreshAvatar = async () => {
    try {
      const response = await usersService.fetchLatestAvatar();
      const currentToken = token; // Lấy token hiện tại
      const nhigiaExpired = await AsyncStorage.getItem("nhigia_expired");

      if (response?.success && response?.avatar) {
        let avatarUrl = response.avatar.file_path;

        if (avatarUrl && !avatarUrl.startsWith("http")) {
          const baseUrl = BE_URL;
          avatarUrl = `${baseUrl}${avatarUrl}`;
        }

        const updatedUser = { ...user, avatar: avatarUrl };
        setUser(updatedUser);

        // Gọi đúng với 3 tham số
        await saveUser(updatedUser, currentToken, nhigiaExpired || undefined);

        return avatarUrl;
      } else if (response?.success && !response?.avatar) {
        const { avatar, ...userWithoutAvatar } = user;
        setUser(userWithoutAvatar);
        await saveUser(
          userWithoutAvatar,
          currentToken,
          nhigiaExpired || undefined,
        );
        return null;
      }
    } catch (error) {
      console.error("Error refreshing avatar:", error);
    }
    return null;
  };

  const loadUser = async () => {
    const u = await authService.getUser();
    const t = await authService.getToken();
    const nhigiaExpired = await AsyncStorage.getItem("nhigia_expired");

    if (!t || isTokenExpired(t) || !nhigiaExpired) {
      setUser(null);
      setToken(null);
    } else {
      setUser(u);
      setToken(t);

      startLogoutTimer(nhigiaExpired);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadUser();

    return () => {
      if (logoutTimer.current) {
        clearTimeout(logoutTimer.current);
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        setUser,
        setToken,
        reloadUser: loadUser,
        loading,
        refreshAvatar
      }}
    >
      {children}
      <SessionExpiredModal
        visible={showExpiredModal}
        onConfirm={confirmLogout}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
