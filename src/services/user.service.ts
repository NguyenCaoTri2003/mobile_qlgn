import axiosClient from "../api/axiosClient";

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
};
