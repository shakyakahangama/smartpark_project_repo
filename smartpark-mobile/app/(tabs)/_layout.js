// app/(tabs)/_layout.js
import React from "react";
import { Stack } from "expo-router";

export default function TabsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="vehicle-details" />
      <Stack.Screen name="reservation-details" />
      <Stack.Screen name="reservation-confirmation" />
      <Stack.Screen name="display-reservation" />
      <Stack.Screen name="path-guidance" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="feedback" />
      <Stack.Screen name="logout" />
    </Stack>
  );
}