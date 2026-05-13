import axiosClient from "../api/axiosClient";

export const settingService = {
  async getSystemSettingsApi () {
    const res = await axiosClient.get("/settings");
    return res.data;
  },
};
