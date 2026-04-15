import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import OverviewSection from "../components/guide/OverviewSection";
import AdminSection from "../components/guide/AdminSection";
import FieldsSection from "../components/guide/FieldsSection";
import SidebarMenuGuide from "../components/guide/SidebarMenuGuide";
import ManagerSection from "../components/guide/ManagerSection";
import ShipperSection from "../components/guide/ShipperSection";
import UISection from "../components/guide/UISection";

const { width } = Dimensions.get("window");
const MENU_WIDTH = width * 0.75;

export default function GuideScreen() {
  const [activeSection, setActiveSection] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);

  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const openMenu = () => {
    setMenuOpen(true);

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -MENU_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => setMenuOpen(false));
  };

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection />;
      case "role-admin":
        return <AdminSection />;
      case "role-ql":
        return <ManagerSection />;
      case "role-shipper":
        return <ShipperSection />;
      case "fields":
        return <FieldsSection />;
      case "ui":
        return <UISection />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <View style={styles.container}>
      {/* MAIN CONTENT */}
      <View style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Hướng Dẫn Sử Dụng</Text>
            <Text style={styles.subtitle}>
              Trung tâm hỗ trợ vận hành Nhị Gia Logistics
            </Text>
          </View>
          <TouchableOpacity onPress={openMenu}>
            <Text style={{ color: "#fff", fontSize: 22 }}>☰</Text>
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        <View style={{ flex: 1 }}>{renderSection()}</View>
      </View>

      {/* OVERLAY */}
      {menuOpen && (
        <>
          <TouchableWithoutFeedback onPress={closeMenu}>
            <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
          </TouchableWithoutFeedback>

          {/* SIDEBAR */}
          <Animated.View
            style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}
          >
            <SidebarMenuGuide
              active={activeSection}
              onSelect={(key: any) => {
                setActiveSection(key);
                closeMenu();
              }}
            />
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  header: {
    backgroundColor: "#2563eb",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
  },

  subtitle: {
    color: "#e9e9e9",
    fontSize: 12,
  },

  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: "#fff",
    padding: 16,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,

    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
});
