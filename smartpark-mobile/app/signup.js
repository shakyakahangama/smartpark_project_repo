// app/signup.js
import React, { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import GradientScreen from "../components/GradientScreen";
import TopBar from "../components/TopBar";
import TextField from "../components/TextField";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../src/api/client";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const canClear = useMemo(
    () => !!(name || email || contact || password || confirm),
    [name, email, contact, password, confirm]
  );

  async function onSignup() {
    if (!name || !email || !password || !confirm) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }

    if (!email.toLowerCase().endsWith("@gmail.com")) {
      Alert.alert("Error", "Email must be a @gmail.com address.");
      return;
    }

    const contactRegex = /^\d{10}$/;
    if (contact && !contactRegex.test(contact)) {
      Alert.alert("Error", "Contact number must be exactly 10 digits.");
      return;
    }

    if (password !== confirm) {
      Alert.alert("Error", "Password does not match.");
      return;
    }

    try {
      const data = await api.signup({
        name,
        email,
        contact_number: contact,
        password,
      });

      Alert.alert("Success", data.message || "Account created successfully");
      router.replace("/signin");
    } catch (e) {
      Alert.alert("Signup Failed", e.message);
    }
  }

  return (
    <GradientScreen>
      <TopBar title="" onBack={() => router.back()} />

      <View style={styles.container}>
        <Text style={styles.title}>REGISTRATION</Text>

        <Text style={styles.lbl}>NAME:</Text>
        <TextField value={name} onChangeText={setName} />

        <Text style={styles.lbl}>EMAIL:*</Text>
        <TextField
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Text style={styles.lbl}>CONTACT NUMBER:</Text>
        <TextField
          value={contact}
          onChangeText={setContact}
          keyboardType="phone-pad"
        />

        <Text style={styles.lbl}>PASSWORD:*</Text>
        <TextField
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.lbl}>CONFIRM PASSWORD:*</Text>
        <TextField
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />

        <View style={styles.row}>
          <PrimaryButton
            title="CLEAR"
            onPress={() => {
              if (!canClear) return;
              setName("");
              setEmail("");
              setContact("");
              setPassword("");
              setConfirm("");
            }}
            style={{ flex: 1, marginRight: 10 }}
          />
          <PrimaryButton
            title="SIGN UP"
            onPress={onSignup}
            style={{ flex: 1, marginLeft: 10 }}
          />
        </View>
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  title: {
    color: "white",
    fontSize: 30,
    letterSpacing: 3,
    textAlign: "center",
    marginBottom: 30,
    fontWeight: "600",
  },
  lbl: {
    color: "#ddd",
    marginTop: 16,
    fontSize: 12,
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    marginTop: 28,
  },
});