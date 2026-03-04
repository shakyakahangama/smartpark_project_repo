// app/(tabs)/home.js
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import GradientScreen from "../../components/GradientScreen";
import PrimaryButton from "../../components/PrimaryButton";
import { session } from "../../src/api/store/session";

export default function Home() {
  const user = useMemo(() => session.getUser() || null, []);
  const name = user?.name || "User";

  return (
    <GradientScreen>
      <Text style={styles.hello}>HELLO!{"\n"}{name}</Text>

      <View style={{ marginTop: 20, gap: 12 }}>
        <PrimaryButton title="INPUT VEHICLE DETAILS" onPress={() => router.push("/(tabs)/vehicle-details")} />
        <PrimaryButton title="MAKE RESERVATION" onPress={() => router.push("/(tabs)/reservation-details")} />
        <PrimaryButton title="PATH GUIDANCE" onPress={() => router.push("/(tabs)/path-guidance")} />
        <PrimaryButton title="DISPLAY THE RESERVATION" onPress={() => router.push("/(tabs)/display-reservation")} />
        <PrimaryButton title="NOTIFICATIONS" onPress={() => router.push("/(tabs)/notifications")} />
        <PrimaryButton title="FEEDBACK" onPress={() => router.push("/(tabs)/feedback")} />
        <PrimaryButton title="LOG OUT" onPress={() => router.push("/(tabs)/logout")} />
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  hello: {
    color: "white",
    fontSize: 28,
    letterSpacing: 2,
    fontWeight: "700",
    marginTop: 10,
  },
});