import axiosClient from "../api/axiosClient";

export const logService = {
  async getLogs(params: any) {
    const queryParams: any = {
      page: params.page || 1,
      limit: 20,
      user: params.user || "",
      orderId: params.orderId || "",
      orderCode: params.orderCode || "",
      fromDate: params.fromDate || "",
      toDate: params.toDate || "",
    };

    if (params.actions?.length) {
      queryParams.actions = params.actions.join(",");
    }

    const query = new URLSearchParams(queryParams).toString();

    const res = await axiosClient.get(`/logs?${query}`);
    return res.data;
  },
};