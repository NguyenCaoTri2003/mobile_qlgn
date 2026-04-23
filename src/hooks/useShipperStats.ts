import { useState, useCallback } from "react";
import axios from "axios";
import { orderService } from "../services/order.service";

export default function useShipperStats() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async (params: any) => {
    try {
      setLoading(true);

      const res = await orderService.getShipperStatsParams(params);

      setData(res || []);
    } catch (err) {
      console.log("Shipper stats error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    shipperStats: data,
    loading,
    fetchStats,
  };
}