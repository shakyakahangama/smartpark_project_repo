import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function AuthChoice() {
  const router = useRouter();

  return (
    <LinearGradient colors={["#071a3a", "#243b63", "#b9b9b9"]} style={styles.bg}>
      <View style={{ alignItems: "center", marginTop: 70 }}>
        <Text style={styles.title}>SMART PARK</Text>
        <Text style={styles.sub}>JOIN US OR SIGN IN TO PROCEED.</Text>
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.btn}>
        <Text style={styles.btnText} onPress={() => router.push("/signup")}>
          Sign Up
        </Text>
      </View>

      <View style={{ height: 14 }} />

      <View style={styles.btn}>
        <Text style={styles.btnText} onPress={() => router.push("/signin")}>
          Sign In
        </Text>
      </View>

      <View style={{ height: 70 }} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, paddingHorizontal: 22, paddingTop: 35 },
  title: { color: "white", fontSize: 30, fontWeight: "900", letterSpacing: 1.5 },
  sub: { color: "rgba(255,255,255,0.85)", marginTop: 18, fontWeight: "700" },
  btn: { height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center", backgroundColor: "#0b1d44" },
  btnText: { color: "white", fontSize: 18, fontWeight: "800" },
});