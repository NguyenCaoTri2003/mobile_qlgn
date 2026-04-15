import { createNativeStackNavigator } from "@react-navigation/native-stack";

import OrderListScreen from "../screens/OrderListScreen";
import OrderDetailScreen from "../screens/OrderDetailScreen";
import CompleteOrderScreen from "../screens/CompleteOrderScreen";
import { OrdersStackParamList } from "./types";
import ReturnOrderScreen from "../screens/ReturnOrderScreen";
import SupplementScreen from "../screens/SupplementScreen";
import ReassignOrderScreen from "../screens/ReassignOrderScreen";

const Stack = createNativeStackNavigator<OrdersStackParamList>();

export default function OrdersStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="OrderList"
        component={OrderListScreen}
        options={{ title: "Đơn giao nhận" }}
      />

      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: "Chi tiết đơn" }}
      />

      <Stack.Screen
        name="CompleteOrder"
        component={CompleteOrderScreen}
        options={{ title: "Hoàn tất đơn hàng" }}
      />

      <Stack.Screen
        name="ReturnOrder"
        component={ReturnOrderScreen}
        options={{ title: "Hoàn đơn hàng" }}
      />

      <Stack.Screen
        name="SupplementScreen"
        component={SupplementScreen}
        options={{ title: "Yêu cầu bổ sung" }}
      />

      <Stack.Screen
        name="ReassignOrderScreen"
        component={ReassignOrderScreen}
        options={{ title: "Phân công lại nhân viên giao nhận" }}
      />
    </Stack.Navigator>
  );
}
