// components/TextField.js
import React from "react";
import { StyleSheet, TextInput, View } from "react-native";

export default function TextField({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  style,
}) {
  return (
    <View style={[styles.wrap, style]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#777"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "white",
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 44,
    justifyContent: "center",
    marginTop: 8,
  },
  input: { fontSize: 14, color: "#111" },
});