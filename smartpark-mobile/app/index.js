import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function Index() {
  const router = useRouter();

  return (
    <LinearGradient colors={["#071a3a", "#243b63", "#b9b9b9"]} style={styles.bg}>
      
      {/* LOGO */}
      <View style={{ alignItems: "center", marginTop: 70 }}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>SMART PARK</Text>

        <Text style={styles.sub}>
          PARKING SYSTEM THAT CAN ALLOCATE ANYWHERE, ANYTIME.
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      {/* GET STARTED BUTTON */}
      <Pressable style={styles.btn} onPress={() => router.push("/auth-choice")}>
        <Text style={styles.btnText}>Get Started</Text>
      </Pressable>

      <View style={{ height: 60 }} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 35,
  },

  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 18,
  },

  title: {
    color: "white",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 2,
  },

  sub: {
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 10,
    fontWeight: "700",
  },

  btn: {
    height: 55,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0b1d44",
  },

  btnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
});