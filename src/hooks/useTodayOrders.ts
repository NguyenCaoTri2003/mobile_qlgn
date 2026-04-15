import { useState } from "react";
import { orderService } from "../services/order.service";

export default function useTodayOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTodayOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getTodayOrdersForShipper();
      setOrders(res.data || []);
    } catch (err) {
      console.log("Fetch today orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    orders,
    loading,
    refresh: fetchTodayOrders,
  };
}