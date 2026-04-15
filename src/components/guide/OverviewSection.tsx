import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
} from "react-native";
import ImagePreviewModal from "../ImagePreviewModal";
import YoutubePlayer from "react-native-youtube-iframe";
import { Linking } from "react-native";

const { width } = Dimensions.get("window");

export default function OverviewSection() {
  const [preview, setPreview] = useState<any | null>(null);

  const images = {
    quytrinh: require("../../../assets/images/guide/quytrinh.png"),
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* TITLE */}
      <Text style={styles.title}>Chào mừng bạn đến với Hệ thống</Text>

      {/* DESCRIPTION */}
      <Text style={styles.description}>
        Ứng dụng <Text style={styles.bold}>Nhị Gia Logistics</Text> được thiết
        kế để số hóa và tối ưu quy trình giao nhận hồ sơ giữa các bộ phận chuyên
        môn và đội ngũ giao nhận. Hệ thống đảm bảo tính minh bạch, tức thời và
        khả năng theo dõi lịch sử chặt chẽ.
      </Text>

      {/* CARDS */}
      <View style={styles.cardContainer}>
        {/* CARD 1 */}
        <View style={[styles.card, styles.blueCard]}>
          <Text style={styles.cardTitle}>🚀 Nhanh chóng</Text>
          <Text style={styles.cardText}>
            Khởi tạo và điều phối yêu cầu chỉ trong vài giây.
          </Text>
        </View>

        {/* CARD 2 */}
        <View style={[styles.card, styles.greenCard]}>
          <Text style={styles.cardTitle}>🛡️ Chính xác</Text>
          <Text style={styles.cardText}>
            Checklist hồ sơ và chữ ký số xác thực tại chỗ.
          </Text>
        </View>
      </View>

      {/* PROCESS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Quy trình vận hành tổng thể</Text>

        <View style={styles.imageBox}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setPreview(images.quytrinh)}
          >
            <Image source={images.quytrinh} style={styles.image} />
          </TouchableOpacity>

          {/* <View style={styles.downloadBtn}>
            <Text style={styles.downloadText}>⬇ Lưu</Text>
          </View> */}
        </View>

        <Text style={styles.caption}>Quy trình giao nhận hồ sơ</Text>
      </View>

      {/* VIDEO */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎬 Video hướng dẫn chi tiết</Text>

        <View style={styles.videoBox}>
          <YoutubePlayer height={220} play={false} videoId="PfK9MuXcmvk" />
        </View>

        {/* BUTTON */}
        <TouchableOpacity
          style={styles.youtubeBtn}
          onPress={() =>
            Linking.openURL("https://www.youtube.com/watch?v=PfK9MuXcmvk")
          }
        >
          <Text style={styles.youtubeText}>🚀 Mở trên YouTube</Text>
        </TouchableOpacity>
      </View>

      {/* IMAGE PREVIEW */}
      <ImagePreviewModal
        visible={!!preview}
        image={preview}
        onClose={() => setPreview(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111",
    marginBottom: 12,
    borderBottomWidth: 4,
    borderBottomColor: "#2563eb",
    alignSelf: "flex-start",
    paddingBottom: 4,
  },

  description: {
    color: "#555",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },

  bold: {
    fontWeight: "700",
    color: "#111",
  },

  /* CARDS */
  cardContainer: {
    gap: 12,
    marginBottom: 20,
  },

  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },

  blueCard: {
    backgroundColor: "#eff6ff",
    borderColor: "#dbeafe",
  },

  greenCard: {
    backgroundColor: "#ecfdf5",
    borderColor: "#d1fae5",
  },

  cardTitle: {
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 6,
  },

  cardText: {
    color: "#555",
    fontSize: 13,
  },

  /* SECTION */
  section: {
    marginTop: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },

  imageBox: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
  },

  image: {
    width: "100%",
    height: 200,
  },

  downloadBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  downloadText: {
    color: "#fff",
    fontSize: 12,
  },

  caption: {
    textAlign: "center",
    fontSize: 12,
    color: "#888",
    marginTop: 6,
    fontStyle: "italic",
  },

  /* PREVIEW */
  preview: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },

  closeBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
  },

  close: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
  },

  previewImage: {
    width: width,
    height: width,
  },

  videoBox: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 10,
  },

  youtubeBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  youtubeText: {
    color: "#fff",
    fontWeight: "700",
  },
});
