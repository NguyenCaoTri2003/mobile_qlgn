import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ActivityLogScreen from "../screens/ActivityLogScreen";

const Stack = createNativeStackNavigator();

export default function ActivityLogStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ActivityLogList"
        component={ActivityLogScreen}
        options={{ title: "Lịch sử hoạt động" }}
      />
    </Stack.Navigator>
  );
}