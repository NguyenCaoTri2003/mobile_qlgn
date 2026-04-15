import React, { createContext, useContext, useState, useEffect } from "react";
import { orderService } from "../services/order.service";
import { useAuth } from "./AuthContext";

const OrderContext = createContext<any>(null);

export function OrderProvider({ children }: any) {
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const { user } = useAuth();

  const loadCounts = async () => {
    const res = await orderService.getOrderCounts();
    setPendingOrdersCount(res.PENDING_GROUP || 0);
  };

  useEffect(() => {
    if (user) {
      loadCounts();
    }
  }, [user]);

  return (
    <OrderContext.Provider
      value={{
        pendingOrdersCount,
        reloadOrderCounts: loadCounts,
        setPendingOrdersCount,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrderContext() {
  return useContext(OrderContext);
}
