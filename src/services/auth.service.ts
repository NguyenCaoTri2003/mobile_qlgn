import AsyncStorage from "@react-native-async-storage/async-storage";

export const authService = {

  async getUser() {
    const user = await AsyncStorage.getItem("nhigia_user");
    return user ? JSON.parse(user) : null;
  },

  async getToken() {
    const token = await AsyncStorage.getItem("access_token");
    return token || null;
  }

};