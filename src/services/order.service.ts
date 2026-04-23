import axiosClient from "../api/axiosClient";

export const orderService = {
  async getOrders(
    page = 1,
    limit = 20,
    search = "",
    dept = "",
    filter = "ALL",
    date = "",
    timeFilter = "",
    status = "",
    orderType = "",
  ) {
    const res = await axiosClient.get(
      `/orders?page=${page}&limit=${limit}&search=${search}&dept=${dept}&filter=${filter}&date=${date}&timeFilter=${timeFilter}&statuses=${status}&orderType=${orderType}`,
    );

    return res.data;
  },

  async getOrderDetail(id: number) {
    const res = await axiosClient.get(`/orders/${id}`);
    return res.data;
  },

  // async getDashboardStats() {
  //   const res = await axiosClient.get(`/orders/dashboard-stats`);
  //   return res.data;
  // },

  async getDashboardStats(params?: any) {
    const res = await axiosClient.get(`/orders/dashboard-stats`, {
      params,
    });
    return res.data;
  },

  async getShipperStatsParams(params?: any) {
    const res = await axiosClient.post(`/orders/shippers-stats-params`, params);
    return res.data;
  },

  async getTodayOrdersForShipper() {
    const res = await axiosClient.get(`/orders/today-for-shipper`);
    return res.data;
  },

  async createOrder(order: any) {
    const res = await axiosClient.post(`/orders`, order);
    return res.data;
  },

  async updateOrder(id: number, updates: any) {
    const res = await axiosClient.put(`/orders/${id}`, updates);
    return res.data;
  },

  async deleteOrder(id: number) {
    const res = await axiosClient.delete(`/orders/${id}`);
    return res.data;
  },

  async getOrderCounts() {
    const res = await axiosClient.get("/orders/counts");
    return res.data;
  },

  async assignReceiver(
    id: number,
    order_code: string,
    receiver_id: number,
    receiver_email: string,
    receiver_name: string,
    attachments: number[],
  ) {
    const res = await axiosClient.post(`/orders/${id}/assign`, {
      order_code,
      receiver_id,
      receiver_email,
      receiver_name,
      attachments,
    });

    return res.data;
  },

  async assignMultiple(
    order_ids: number[],
    receiver_id: number,
    receiver_email: string,
    receiver_name: string,
  ) {
    const res = await axiosClient.post(`/orders/assign-multiple`, {
      order_ids,
      receiver_id,
      receiver_email,
      receiver_name,
    });

    return res.data;
  },

  async assignByFilter(filters: any, shipper: any) {
    const res = await axiosClient.post(`/orders/assign-by-filter`, {
      ...filters,
      receiver_id: shipper.id,
      receiver_email: shipper.email,
      receiver_name: shipper.name,
    });

    return res.data;
  },
  async countByFilter(filters: any) {
    const res = await axiosClient.get(`/orders/count-by-filter`, {
      params: filters,
    });
    return res.data;
  },

  async reassignOrder(
    id: number,
    order_code: string,
    receiver_id: number,
    receiver_email: string,
    receiver_name: string,
    date: string,
    time: string,
    attachments: number[],
  ) {
    const res = await axiosClient.post(`/orders/${id}/reassign`, {
      order_code,
      receiver_id,
      receiver_email,
      receiver_name,
      date,
      time,
      attachments,
    });

    return res.data;
  },

  async shipperAccept(id: number, checklist: any[], missingDocs?: string) {
    const res = await axiosClient.post(`/orders/${id}/accept`, {
      checklist,
      missingDocs,
    });

    return res.data;
  },

  async shipperAcceptPick(id: number) {
    const res = await axiosClient.post(`/orders/${id}/accept/pick`);
    return res.data;
  },

  async shipperReject(id: number, reason: string, order_code: string) {
    const res = await axiosClient.post(`/orders/${id}/shipper-reject`, {
      reason,
      order_code,
    });

    return res.data;
  },

  async shipperComplete(
    id: number,
    files: any[],
    location: any,
    signature?: any,
    audioFile?: any,
    note?: string,
    checklist?: any[],
    missingNote?: string | null,
  ) {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", {
        uri: file.uri,
        type: file.mimeType || "image/jpeg",
        name: file.fileName || "photo.jpg",
      } as any);
    });

    if (signature) {
      formData.append("signature", {
        uri: signature.uri,
        type: "image/png",
        name: "signature.png",
      } as any);
    }

    if (audioFile) {
      formData.append("audio", {
        uri: audioFile.uri,
        type: audioFile.type || "audio/m4a",
        name: audioFile.name || `audio-${Date.now()}.m4a`,
      } as any);
    }

    if (note) {
      formData.append("note", note);
    }

    formData.append("location", JSON.stringify(location));

    if (checklist && checklist.length > 0) {
      formData.append("checklist", JSON.stringify(checklist));
    }

    if (missingNote) {
      formData.append("missingNote", missingNote);
    }

    const res = await axiosClient.post(
      `/orders/${id}/shipper-complete`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return res.data;
  },

  async shipperReturn(
    id: number,
    status: string,
    files: any[],
    location: any,
    reason: string,
  ) {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", {
        uri: file.uri,
        type: file.mimeType || "image/jpeg",
        name: file.fileName || "photo.jpg",
      } as any);
    });

    formData.append("reason", reason);
    formData.append("status", status);
    formData.append("location", JSON.stringify(location));

    const res = await axiosClient.post(
      `/orders/${id}/shipper-return`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return res.data;
  },

  async shipperReturnSupplement(id: number, note: string, order_code: string) {
    const res = await axiosClient.post(
      `/orders/${id}/shipper-return-supplement`,
      { note, order_code },
    );

    return res.data;
  },

  async rejectOrder(id: number, reason: string) {
    const res = await axiosClient.post(`/orders/${id}/reject`, { reason });
    return res.data;
  },

  async completeOrder(id: number) {
    const res = await axiosClient.post(`/orders/${id}/complete`, {});
    return res.data;
  },

  async adminFinalize(id: number, approved: boolean, reason?: string) {
    const res = await axiosClient.post(`/orders/${id}/finalize`, {
      approved,
      reason,
    });

    return res.data;
  },

  async managerApproveReturn(
    id: number,
    attemptId: number,
    approved: boolean,
    reason?: string,
  ) {
    const res = await axiosClient.post(`/orders/${id}/manage-return`, {
      attemptId,
      approved,
      reason,
    });

    return res.data;
  },

  async requestSupplement(
    id: number,
    note: string,
    created_by: number,
    order_code: string,
    creator: string,
  ) {
    const res = await axiosClient.post(`/orders/${id}/request-supplement`, {
      note,
      created_by,
      order_code,
      creator,
    });

    return res.data;
  },

  async qlArchivedOrder(
    id: number,
    order_code: string,
  ) {
    const res = await axiosClient.post(`/orders/${id}/archived`, {order_code});

    return res.data;
  },

  async resolveRequest(id: number, note: string) {
    const res = await axiosClient.put(`/orders/${id}/resolve`, { note });
    return res.data;
  },

  async updateOrderSort(userId: number, orderIds: number[]) {
    const res = await axiosClient.post(`/orders/update-sort`, {
      userId,
      orderIds,
    });

    return res.data;
  },

  async setShipperHighlightColor(
    orderId: number,
    color: "red" | "blue" | "yellow" | null,
  ) {
    const res = await axiosClient.put(`/orders/${orderId}/highlight`, {
      color,
    });

    return res.data;
  },

  async exportPdf(html: string) {
    const res = await axiosClient.post(
      `/pdf/export-pdf`,
      { html },
      {
        responseType: "arraybuffer",
      },
    );
    return res.data;
  },

  async exportDocx(order: any, attachments: any[]) {
    const res = await axiosClient.post(
      `/export-docx`,
      { order, attachments },
      {
        responseType: "arraybuffer",
      },
    );

    return res.data;
  },
};
