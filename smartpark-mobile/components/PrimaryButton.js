// components/PrimaryButton.js
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function PrimaryButton({ title, onPress, style, disabled }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[style, { opacity: disabled ? 0.6 : 1 }]}>
      <LinearGradient colors={["#3b3b3b", "#061a44"]} style={styles.btn}>
        <Text style={styles.txt}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  txt: { color: "white", fontWeight: "700", letterSpacing: 0.5 },
});