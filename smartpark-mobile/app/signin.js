import React, { useState } from "react";
import { Text, TextInput, StyleSheet, Alert, Pressable, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { api } from "../src/api/client";

function isValidEmail(email) {
  const e = email.trim();
  return e.includes("@") && e.includes(".");
}

export default function Signin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onLogin() {
    const cleanEmail = email.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      return Alert.alert("Invalid Email", "Enter valid email (example@gmail.com)");
    }

    if (!password) {
      return Alert.alert("Password required");
    }

    try {
      await api.login({ email: cleanEmail, password });

      router.replace({
        pathname: "/home",
        params: { email: cleanEmail },
      });
    } catch (e) {
      Alert.alert("Login Error", e.message);
    }
  }

  return (
    <LinearGradient
      colors={["#071a3a", "#243b63", "#b9b9b9"]}
      style={styles.bg}
    >
      {/* BACK BUTTON */}
      <Pressable onPress={() => router.replace("/auth-choice")}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>LOGIN</Text>

      <Text style={styles.label}>EMAIL:</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>PASSWORD:</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable style={styles.btn} onPress={onLogin}>
        <Text style={styles.btnText}>Sign In</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, paddingHorizontal: 22, paddingTop: 60 },

  back: {
    color: "white",
    fontSize: 16,
    marginBottom: 10,
  },

  title: {
    color: "white",
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 20,
  },

  label: {
    color: "white",
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 8,
  },

  input: {
    height: 50,
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 14,
    fontSize: 16,
  },

  btn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0b1d44",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  btnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
});