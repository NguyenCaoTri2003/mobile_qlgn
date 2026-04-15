import axiosClient from "../api/axiosClient";

export const departmentService = {
  async loadDepartments() {
    try {
      const res = await axiosClient.get("/departments");
      return res.data || [];
    } catch (err) {
      console.log("Load departments error:", err);
      return [];
    }
  },
};
