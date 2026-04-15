import { createNativeStackNavigator } from "@react-navigation/native-stack";
import NotificationScreen from "../screens/NotificationScreen";

const Stack = createNativeStackNavigator();

export default function NotificationsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="NotificationList"
        component={NotificationScreen}
        options={{ title: "Thông báo" }}
      />
    </Stack.Navigator>
  );
}