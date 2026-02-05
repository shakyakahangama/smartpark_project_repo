import { Stack } from "expo-router";

export default function Layout() {
  return <Stack screenOptions={{headerShown: true,
headerStyle: { backgroundColor: "#071a3a" },
headerTintColor: "#fff",
headerTitleStyle: { fontWeight: "900" },
 }}
  />
;
}
