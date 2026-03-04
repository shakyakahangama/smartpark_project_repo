// components/TopBar.js
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TopBar({ title, onBack, rightText }) {
  return (
    <View style={styles.bar}>
      <Pressable onPress={onBack} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color="white" />
      </Pressable>
      <View style={styles.center}>
        <Text style={styles.title}>{title || ""}</Text>
      </View>
      <View style={styles.right}>
        {!!rightText && <Text style={styles.rightTxt}>{rightText}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center" },
  right: { width: 80, alignItems: "flex-end" },
  title: { color: "white", fontWeight: "700" },
  rightTxt: { color: "white", fontWeight: "600" },
});