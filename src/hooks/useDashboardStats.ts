import { useEffect, useState } from "react";
import { orderService } from "../services/order.service";
import { connectSocket } from "../services/socket.service";
import { useAuth } from "../contexts/AuthContext";

export default function useDashboardStats() {
  const { user } = useAuth();

  const now = new Date();

  const [range, setRange] = useState<"day" | "month" | "quarter" | "year">(
    "day",
  );

  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const getCurrentDate = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const [selectedDate, setSelectedDate] = useState(getCurrentDate());

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const [selectedQuarter, setSelectedQuarter] = useState(
    Math.floor(now.getMonth() / 3) + 1,
  );

  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    supplement: 0,
    completed: 0,
    waiting: 0,
    assigned: 0,
    processing: 0,
    vsvn: 0,
    vsnn: 0,
    gpld: 0,
  });

  const [loading, setLoading] = useState(true);

  const buildParams = () => {
    const params: any = { range };

    if (range === "day") {
      params.date = selectedDate;
    }

    if (range === "month") {
      params.month = selectedMonth;
    }

    if (range === "quarter") {
      params.quarter = selectedQuarter;
      params.year = selectedYear;
    }

    if (range === "year") {
      params.year = selectedYear;
    }

    return params;
  };

  const loadStats = async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      const params = buildParams();
      const res = await orderService.getDashboardStats(params);
      setStats(res.data ?? res);
    } catch (err) {
      console.log("Dashboard stats error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    // if (user) {
    //   connectSocket(user.id, user.role, {
    //     dashboardUpdate: () => {
    //       loadStats(false);
    //     },
    //   });
    // }
  }, [range, selectedDate, selectedMonth, selectedQuarter, selectedYear]);

  return {
    stats,
    loading,
    refresh: loadStats,

    range,
    setRange,

    selectedDate,
    setSelectedDate,

    selectedMonth,
    setSelectedMonth,

    selectedQuarter,
    setSelectedQuarter,

    selectedYear,
    setSelectedYear,
  };
}
