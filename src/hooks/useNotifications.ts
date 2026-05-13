import { useState, useRef } from "react";
import { notificationService } from "../services/notification.service";

export default function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Ref để lưu unreadCount hiện tại, tránh reset về 0 khi loading
  const currentUnreadCount = useRef(0);

  const loadNotifications = async (pageNum = 1, loadMore = false) => {
    try {
      const res = await notificationService.getNotifications(pageNum, 10);

      const newData = res.data || [];

      if (loadMore) {
        setNotifications((prev) => [...prev, ...newData]);
      } else {
        setNotifications(newData);
      }

      setPage(pageNum);
      setTotalPages(res.totalPages || 1);

      // Chỉ update unreadCount nếu có giá trị từ server
      const newUnreadCount = res.unreadCount;
      if (typeof newUnreadCount === "number" && newUnreadCount >= 0) {
        setUnreadCount(newUnreadCount);
        currentUnreadCount.current = newUnreadCount;
      }
    } catch (err) {
      console.log("Notification error", err);
    }
  };

  const loadMore = async () => {
    if (page >= totalPages) return;
    await loadNotifications(page + 1, true);
  };

  return {
    notifications,
    unreadCount,
    reload: () => loadNotifications(1),
    loadMore,
    hasMore: page < totalPages,
  };
}