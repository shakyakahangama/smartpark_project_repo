// components/GradientScreen.js
import React from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function GradientScreen({ children, style }) {
  return (
    <LinearGradient colors={["#061a44", "#102a66", "#8b8b8b"]} style={styles.bg}>
      <SafeAreaView style={[styles.safe, style]}>
        <View style={styles.inner}>{children}</View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 18, paddingTop: 10 },
});