import React from "react";
import { Text, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function PathGuidance() {
  return (
    <LinearGradient
      colors={["#071a3a", "#243b63", "#b9b9b9"]}
      style={styles.bg}
    >
      <Text style={styles.title}>PATH GUIDANCE</Text>

      <View style={styles.mapBox}>
        <Text style={styles.mapText}>🗺 Live Map View</Text>
        <Text style={styles.subText}>
          (Camera + AI guidance will be integrated later)
        </Text>
      </View>

      <Text style={styles.info}>
        Follow the highlighted path to reach your reserved slot.
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, paddingHorizontal: 22, paddingTop: 60 },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 20,
  },
  mapBox: {
    height: 250,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  mapText: { fontSize: 20, fontWeight: "900" },
  subText: { marginTop: 6, fontSize: 13, opacity: 0.7 },
  info: {
    color: "white",
    marginTop: 30,
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
});
