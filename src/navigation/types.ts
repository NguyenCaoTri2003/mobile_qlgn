export type RootTabParamList = {
  Dashboard: undefined;
  Orders: { screen?: string; params?: any };
  Notifications: undefined;
  Profile: undefined;
};

export type OrdersStackParamList = {
  OrderList: undefined;
  OrderDetail: { id: number };
  CompleteOrder: { id: number, attachments?: any[], missingNote?: string, orderType?: string};
  ReturnOrder: { id: number };
  SupplementScreen: { id: number, createdBy: number, orderCode: string; creator: string };
  ReassignOrderScreen: { id: number, orderCode: string; attachments: any };
  OrderLogs: { orderId: number };
};
