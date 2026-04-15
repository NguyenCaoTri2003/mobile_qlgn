import { createNavigationContainerRef } from "@react-navigation/native";
import { RootTabParamList } from "./types";

export const navigationRef = createNavigationContainerRef<RootTabParamList>();

export function navigate(name: any, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}