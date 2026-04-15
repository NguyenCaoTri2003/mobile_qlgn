import axiosClient from "../api/axiosClient";

export const notificationService = {
  async getNotifications(page = 1, limit = 10) {
    const res = await axiosClient.get("/notifications", {
      params: { page, limit },
    });

    return res.data;
  },

  async markAllRead() {
    const res = await axiosClient.put("/notifications/read-all");
    return res.data;
  },

  async markRead(id: number) {
    const res = await axiosClient.put(`/notifications/${id}/read`);
    return res.data;
  },
};
