import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "../screens/ProfileScreen";
import GuideScreen from "../screens/GuideScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import ProfileDetailScreen from "../screens/ProfileDetailScreen";

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfileDetail"
        component={ProfileDetailScreen}
        options={{ title: "Thông tin tài khoản" }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: "Đổi mật khẩu" }}
      />
      <Stack.Screen
        name="GuideScreen"
        component={GuideScreen}
        options={{ title: "Hướng dẫn sử dụng" }}
      />
    </Stack.Navigator>
  );
}
