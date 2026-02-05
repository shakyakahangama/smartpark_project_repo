import React, { useState } from "react";
import { Text, TextInput, StyleSheet, Alert, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function Feedback() {
  const [message, setMessage] = useState("");

  function submit() {
    if (!message) {
      Alert.alert("Error", "Please write feedback");
      return;
    }
    Alert.alert("Thank you ❤️", "Feedback submitted");
    setMessage("");
  }

  return (
    <LinearGradient colors={["#071a3a", "#243b63", "#b9b9b9"]} style={styles.bg}>
      <Text style={styles.title}>Feedback</Text>

      <TextInput
        style={styles.box}
        multiline
        value={message}
        onChangeText={setMessage}
        placeholder="Write your feedback here..."
        placeholderTextColor="#888"
      />

      <Pressable style={styles.btn} onPress={submit}>
        <Ionicons name="send" size={20} color="white" />
        <Text style={styles.btnText}>Submit</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, padding: 24, paddingTop: 60 },
  title: { color: "white", fontSize: 28, fontWeight: "900", marginBottom: 20 },
  box: {
    height: 160,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    textAlignVertical: "top",
    fontSize: 16,
    elevation: 3,
  },
  btn: {
    marginTop: 30,
    height: 54,
    borderRadius: 26,
    backgroundColor: "#0b1d44",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: { color: "white", fontSize: 18, fontWeight: "800" },
});
