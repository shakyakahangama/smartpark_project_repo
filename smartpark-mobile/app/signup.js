import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { api } from "../src/api/client";

export default function Signup() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [password, setPassword] = useState("");

  async function onSignup() {
    try {
      const res = await api.signup({
        name,
        email,
        password,
        username: email ? email.split("@")[0] : "",
        contact_no: contactNo,
      });
      Alert.alert("Success ✅", res.message);
      router.replace("/signin");
    } catch (e) {
      Alert.alert("Signup Error", e.message);
    }
  }

  function onClear() {
    setName("");
    setEmail("");
    setContactNo("");
    setPassword("");
  }

  return (
    <LinearGradient colors={["#071a3a", "#243b63", "#b9b9b9"]} style={styles.bg}>
      <Text style={styles.big}>REGISTRATION</Text>

      <Text style={styles.label}>NAME:</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>EMAIL:</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />

      <Text style={styles.label}>CONTACT NUMBER:</Text>
      <TextInput style={styles.input} value={contactNo} onChangeText={setContactNo} />

      <Text style={styles.label}>PASSWORD:</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

      <View style={{ height: 18 }} />

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Pressable style={[styles.btn, { backgroundColor: "#2c2f36" }]} onPress={onClear}>
          <Text style={styles.btnText}>Clear</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={onSignup}>
          <Text style={styles.btnText}>Sign Up</Text>
        </Pressable>
      </View>

      <View style={{ height: 18 }} />
      <Text style={styles.link} onPress={() => router.replace("/signin")}>
        Already have an account? Sign In
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, paddingHorizontal: 22, paddingTop: 50 },
  big: { color: "white", fontSize: 28, fontWeight: "900", textAlign: "center", marginBottom: 18 },
  label: { color: "white", fontWeight: "800", marginTop: 10, marginBottom: 8 },
  input: { height: 50, backgroundColor: "white", borderRadius: 16, paddingHorizontal: 14, fontSize: 16 },
  btn: { flex: 1, height: 52, borderRadius: 26, backgroundColor: "#0b1d44", justifyContent: "center", alignItems: "center" },
  btnText: { color: "white", fontSize: 18, fontWeight: "800" },
  link: { color: "white", textAlign: "center", marginTop: 10, fontWeight: "700", textDecorationLine: "underline" },
});
