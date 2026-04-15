import React from "react";
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  image: string | any; // uri hoặc require
  onClose: () => void;
};

export default function ImagePreviewModal({
  visible,
  image,
  onClose,
}: Props) {
  if (!visible) return null;

  const source =
    typeof image === "string" ? { uri: image } : image;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        {/* CLOSE BUTTON */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {/* CLICK OUTSIDE TO CLOSE */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />

        {/* IMAGE */}
        <Image
          source={source}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: "100%",
    height: "80%",
  },

  closeBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
});