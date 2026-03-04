// app/signin.js
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import GradientScreen from "../components/GradientScreen";
import TopBar from "../components/TopBar";
import TextField from "../components/TextField";
import PrimaryButton from "../components/PrimaryButton";
import { api } from "../src/api/client";
import { session } from "../src/api/store/session";

export default function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function onSignin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }

    try {
      const data = await api.login({
        email: email.trim().toLowerCase(),
        password,
      });

      await session.setAuth(data.user, data.vehicles);

      router.replace("/(tabs)/home");
    } catch (err) {
      Alert.alert("Login Failed", err.message || "Invalid credentials");
    }
  }

  return (
    <GradientScreen>
      <TopBar title="" onBack={() => router.back()} />

      <View style={styles.container}>
        <Text style={styles.title}>LOGIN</Text>

        <Text style={styles.label}>EMAIL:</Text>
        <TextField
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Text style={styles.label}>PASSWORD:</Text>
        <TextField
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />

        <View style={styles.showRow}>
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.checkboxBox}
          >
            {showPassword && <View style={styles.checkboxInner} />}
          </Pressable>
          <Text style={styles.showText}>SHOW PASSWORD</Text>
        </View>

        <PrimaryButton title="SIGN IN" onPress={onSignin} />

        <Text style={styles.link}>FORGOT PASSWORD</Text>

        <Text style={styles.link}>
          DON'T HAVE AN ACCOUNT?{" "}
          <Text
            style={styles.signup}
            onPress={() => router.push("/signup")}
          >
            SIGN UP
          </Text>
        </Text>
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
    fontSize: 32,
    textAlign: "center",
    letterSpacing: 3,
    marginBottom: 30,
    fontWeight: "600",
  },

  label: {
    color: "#ddd",
    marginTop: 16,
    fontSize: 12,
    letterSpacing: 1,
  },

  showRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },

  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    backgroundColor: "#fff",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#061a44",
  },

  showText: {
    color: "#ddd",
    fontSize: 11,
    letterSpacing: 1,
  },

  link: {
    color: "#ddd",
    textAlign: "center",
    marginTop: 14,
    fontSize: 11,
    letterSpacing: 1,
  },

  signup: {
    color: "#9fc5ff",
  },
});