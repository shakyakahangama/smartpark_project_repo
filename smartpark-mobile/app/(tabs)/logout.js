// app/(tabs)/logout.js
import React from "react";
import { StyleSheet, Text, View, Image } from "react-native";
import { router } from "expo-router";
import GradientScreen from "../../components/GradientScreen";
import TopBar from "../../components/TopBar";
import PrimaryButton from "../../components/PrimaryButton";
import { session } from "../../src/api/store/session";

export default function Logout() {
  async function yes() {
    await session.clear();
    router.replace("/");
  }

  return (
    <GradientScreen>
      <TopBar title="Nethmi Wanigasekara" onBack={() => router.back()} />
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={styles.q}>ARE YOU SURE YOU WANT TO LOG OUT?</Text>

        <View style={styles.row}>
          <PrimaryButton title="NO" onPress={() => router.back()} style={{ flex: 1, marginRight: 10 }} />
          <PrimaryButton title="YES" onPress={yes} style={{ flex: 1, marginLeft: 10 }} />
        </View>

        <View style={{ alignItems: "center", marginTop: 70, opacity: 0.9 }}>
          <Image source={require("../../assets/images/logo.png")} style={{ width: 60, height: 60 }} />
          <Text style={styles.brand}>SMART PARK</Text>
        </View>
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  q: { color: "white", textAlign: "center", letterSpacing: 1, fontWeight: "700" },
  row: { flexDirection: "row", marginTop: 24 },
  brand: { color: "white", fontSize: 22, letterSpacing: 2, marginTop: 8, fontWeight: "600" },
});