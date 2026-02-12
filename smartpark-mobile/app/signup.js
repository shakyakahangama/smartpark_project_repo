import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { api } from "../src/api/client";

export default function Signup() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState(""); 
  const [email, setEmail] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [password, setPassword] = useState("");

  // email must contain @ and end with .com
  function isValidEmail(value) {
    const v = value.trim().toLowerCase();
    return v.includes("@") && v.endsWith(".com");
  }

  // contact must be exactly 10 digits
  function isValidPhone(value) {
    return /^\d{10}$/.test(value);
  }

  async function onSignup() {
    try {
      const cleanName = name.trim();
      const cleanUsername = username.trim();
      const cleanEmail = email.trim().toLowerCase();
      const cleanContact = contactNo.trim();
      const cleanPassword = password;

      if (!cleanName) return Alert.alert("Error", "Name is required");

      if (!cleanUsername)
        return Alert.alert("Error", "Username is required");

      if (!isValidEmail(cleanEmail)) {
        return Alert.alert(
          "Invalid Email",
          "Email must be like example@gmail.com"
        );
      }

      if (!isValidPhone(cleanContact)) {
        return Alert.alert(
          "Invalid Contact",
          "Contact number must be exactly 10 digits"
        );
      }

      if (!cleanPassword || cleanPassword.length < 4) {
        return Alert.alert(
          "Invalid Password",
          "Password must be at least 4 characters"
        );
      }

      //  send fields (backend can ignore extra fields if not needed)
      const res = await api.signup({
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        username: cleanUsername,     // 
        contact_no: cleanContact,    //
      });

      Alert.alert("Success ✅", res.message || "User registered successfully");
      router.replace("/signin");
    } catch (e) {
      Alert.alert("Signup Error", e.message);
    }
  }

  function onClear() {
    setName("");
    setUsername(""); // 
    setEmail("");
    setContactNo("");
    setPassword("");
  }

  return (
    <LinearGradient colors={["#071a3a", "#243b63", "#b9b9b9"]} style={styles.bg}>
      {/* ✅ BACK BUTTON */}
      <Pressable
        onPress={() => router.replace("/auth-choice")}
        style={styles.backWrap}
      >
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Text style={styles.big}>REGISTRATION</Text>

      <Text style={styles.label}>NAME:</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
        placeholderTextColor="#777"
      />

      {/* ✅ USERNAME */}
      <Text style={styles.label}>USERNAME:</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholder="Enter username"
        placeholderTextColor="#777"
      />

      <Text style={styles.label}>EMAIL:</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="example@gmail.com"
        placeholderTextColor="#777"
      />

      <Text style={styles.label}>CONTACT NUMBER:</Text>
      <TextInput
        style={styles.input}
        value={contactNo}
        onChangeText={(t) => {
          const digitsOnly = t.replace(/[^0-9]/g, "");
          setContactNo(digitsOnly);
        }}
        keyboardType="numeric"
        maxLength={10}
        placeholder="10 digit phone number"
        placeholderTextColor="#777"
      />

      <Text style={styles.label}>PASSWORD:</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Enter password"
        placeholderTextColor="#777"
      />

      <View style={{ height: 18 }} />

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Pressable
          style={[styles.btn, { backgroundColor: "#2c2f36" }]}
          onPress={onClear}
        >
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

  backWrap: { marginBottom: 8 },
  backText: { color: "white", fontSize: 16, fontWeight: "800" },

  big: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 18,
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
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0b1d44",
    justifyContent: "center",
    alignItems: "center",
  },

  btnText: { color: "white", fontSize: 18, fontWeight: "800" },

  link: {
    color: "white",
    textAlign: "center",
    marginTop: 10,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});