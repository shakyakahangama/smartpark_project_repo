// app/index.js
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import GradientScreen from "../components/GradientScreen";
import PrimaryButton from "../components/PrimaryButton";

export default function GetStarted() {
  return (
    <GradientScreen>
      <View style={styles.top}>
        <Image source={require("../assets/images/logo.png")} style={styles.logo} />
        <Text style={styles.brand}>SMART PARK</Text>
        <Text style={styles.tag}>PARKING SYSTEM THAT CAN ALLOCATE ANYWHERE, ANYTIME.</Text>
      </View>

      <View style={styles.dotsRow}>
        <View style={styles.dotActive} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      <PrimaryButton title="GET STARTED" onPress={() => router.push("/auth-choice")} />
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: "center", marginTop: 40 },
  logo: { width: 90, height: 90, resizeMode: "contain", marginBottom: 12 },
  brand: { color: "white", fontSize: 28, letterSpacing: 2, fontWeight: "600" },
  tag: { color: "#ddd", marginTop: 8, fontSize: 11, letterSpacing: 1, textAlign: "center" },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginVertical: 26 },
  dot: { width: 8, height: 8, borderRadius: 8, backgroundColor: "#bbb" },
  dotActive: { width: 8, height: 8, borderRadius: 8, backgroundColor: "white" },
});