export function statusColor(status: string) {
  switch (status) {
    case "PENDING":
      return { backgroundColor: "#fee2e2" };

    case "ASSIGNED":
      return { backgroundColor: "#dbeafe" };

    case "PROCESSING":
      return { backgroundColor: "#fef9c3" };

    case "COMPLETED":
      return { backgroundColor: "#ede9fe" };

    case "FINISHED":
      return { backgroundColor: "#dcfce7" };

    case "REJECTED":
      return { backgroundColor: "#f3f4f6" };

    case "SUPPLEMENT_REQUIRED":
      return { backgroundColor: "#ffedd5" };

    case "INCOMPLETE":
      return { backgroundColor: "#fef2f2" };

    case "RETURNED_CUSTOMER":
      return { backgroundColor: "#fee2e2" };

    case "RETURNED_PERSONAL":
      return { backgroundColor: "#e5e7eb" };

    default:
      return { backgroundColor: "#e5e7eb" };
  }
}

export function statusTextColor(status: string) {
  switch (status) {
    case "PENDING":
      return { color: "#b91c1c" };

    case "ASSIGNED":
      return { color: "#1d4ed8" };

    case "PROCESSING":
      return { color: "#a16207" };

    case "COMPLETED":
      return { color: "#6d28d9" };

    case "FINISHED":
      return { color: "#15803d" };

    case "REJECTED":
      return { color: "#374151" };

    case "SUPPLEMENT_REQUIRED":
      return { color: "#c2410c" };

    case "INCOMPLETE":
      return { color: "#dc2626" };

    case "RETURNED_CUSTOMER":
      return { color: "#b91c1c" };

    case "RETURNED_PERSONAL":
      return { color: "#374151" };

    default:
      return { color: "#374151" };
  }
}

export const getStatusBorderColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "#b91c1c";

    case "ASSIGNED":
      return "#1d4ed8";

    case "PROCESSING":
      return "#a16207";

    case "COMPLETED":
      return "#6d28d9";

    case "FINISHED":
      return "#15803d";

    case "REJECTED":
      return "#374151";

    case "SUPPLEMENT_REQUIRED":
      return "#c2410c";

    case "INCOMPLETE":
      return "#dc2626";

    case "RETURNED_CUSTOMER":
      return "#b91c1c";

    case "RETURNED_PERSONAL":
      return "#374151";

    default:
      return "#d1d5db";
  }
};

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: "Chờ tiếp nhận",
    ASSIGNED: "Đã điều phối",
    PROCESSING: "Đang thực hiện",
    COMPLETED: "Đã xong",
    FINISHED: "Hoàn tất",
    REJECTED: "Đã từ chối",
    SUPPLEMENT_REQUIRED: "Cần bổ sung",
    INCOMPLETE: "Chưa hoàn thành",
    RETURNED_CUSTOMER: "Hoàn đơn (Khách hàng)",
    RETURNED_PERSONAL: "Hoàn đơn (Cá nhân)",
  };

  return map[status] || status;
}

export const actionConfig: any = {
  CREATE: { label: "Tạo đơn hàng", color: "#22c55e" },
  UPDATE: { label: "Cập nhật thông tin", color: "#3b82f6" },
  DELETE: { label: "Xóa đơn", color: "#6b7280" },
  ASSIGNED: { label: "Phân công", color: "#a855f7" },
  SHIPPER_ACCEPTED: { label: "NV giao nhận nhận đơn", color: "#6366f1" },
  SHIPPER_REJECTED: { label: "NV giao nhận từ chối", color: "#ef4444" },
  SHIPPER_COMPLETE: { label: "NV giao nhận hoàn thành", color: "#14b8a6" },
  SUPPLEMENT_REQUIRED: { label: "Yêu cầu bổ sung", color: "#f97316" },
  RESOLVE_SUPPLEMENT: { label: "Đã bổ sung", color: "#eab308" },
  RETURNED_CUSTOMER: { label: "Hoàn đơn (Khách không nhận)", color: "#dc2626" },
  RETURNED_PERSONAL: { label: "Hoàn đơn (Lý do cá nhân)", color: "#f43f5e" },
  COMPLETE: { label: "Hoàn thành", color: "#10b981" },
  FINISHED: { label: "Admin duyệt", color: "#15803d" },
  INCOMPLETE: { label: "Admin từ chối", color: "#ec4899" },
  APPROVE_RETURN: { label: "Trưởng phòng duyệt", color: "#15803d" },
  REJECT_RETURN: { label: "Trưởng phòng từ chối", color: "#ec4899" },
};

export const getOrderTypeStyle = (type: string) => {
  switch (type) {
    case "DELIVERY":
      return { backgroundColor: "#dbeafe" }; // blue-100
    case "PICKUP":
      return { backgroundColor: "#dcfce7" }; // green-100
    case "BOTH":
      return { backgroundColor: "#f3e8ff" }; // purple-100
    default:
      return { backgroundColor: "#f3f4f6" }; // gray-100
  }
};

export const getOrderTypeTextStyle = (type: string) => {
  switch (type) {
    case "DELIVERY":
      return { color: "#1d4ed8" }; // blue-700
    case "PICKUP":
      return { color: "#15803d" }; // green-700
    case "BOTH":
      return { color: "#7e22ce" }; // purple-700
    default:
      return { color: "#6b7280" }; // gray-500
  }
};

export const getOrderTypeLabel = (type: string) => {
  switch (type) {
    case "DELIVERY":
      return "Giao hồ sơ";
    case "PICKUP":
      return "Nhận hồ sơ";
    default:
      return "KHÔNG RÕ";
  }
};

export const getOrderTypeHighLabel = (type: string) => {
  switch (type) {
    case "DELIVERY":
      return "Đơn giao gấp";
    case "PICKUP":
      return "Đơn nhận gấp";
    default:
      return "KHÔNG RÕ";
  }
};

export const getPaymentTypeLabel = (type: string) => {
  switch (type) {
    case "COLLECT":
      return "Thu tiền";
    case "PAY":
      return "Thanh toán";
    default:
      return "";
  }
};

export const getPaymentTypeStyle = (type: string) => {
  switch (type) {
    case "COLLECT":
      return { backgroundColor: "#dcfce7" }; // green-100
    case "PAY":
      return { backgroundColor: "#fed7aa" }; // orange-100
    default:
      return { backgroundColor: "#f3f4f6" };
  }
};

export const getPaymentTypeTextStyle = (type: string) => {
  switch (type) {
    case "COLLECT":
      return { color: "#15803d" }; // green-700
    case "PAY":
      return { color: "#c2410c" }; // orange-700
    default:
      return { color: "#6b7280" };
  }
};