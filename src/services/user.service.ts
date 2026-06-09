import axiosClient from "../api/axiosClient";
import { authService } from "./auth.service";

export const usersService = {
  async getShippers() {
    const res = await axiosClient.get("/users/shippers");
    return res.data;
  },

  async getShippersStats(date: any) {
    const res = await axiosClient.post("/orders/shippers-stats", {
      date,
    });
    return res.data;
  },

  async getAdmins(departmentId?: number) {
    const res = await axiosClient.get("/users/admins", {
      params: { departmentId },
    });
    return res.data;
  },

  async changePassword(passcu: string, passmoi: string) {
    const res = await axiosClient.post("/users/change-password", {
      passcu,
      passmoi,
    });
    return res.data;
  },

  async uploadAvatar(formData: FormData) {
    try {
      const token = await authService.getToken();
      const response = await axiosClient.post(
        `/users/upload-avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Upload avatar error:", error);
      throw error.response?.data || error;
    }
  },

  async fetchLatestAvatar() {
    try {
      const token = await authService.getToken();
      const response = await axiosClient.get(`/users/get-avatar`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("Fetch avatar error:", error);
      return null;
    }
  },

  async deleteAvatar() {
    try {
      const token = await authService.getToken();
      const response = await axiosClient.delete(`/users/delete-avatar`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("Delete avatar error:", error);
      throw error.response?.data || error;
    }
  },
};
