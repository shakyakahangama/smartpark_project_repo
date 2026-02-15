import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from "react-native";
import { router } from "expo-router";
import { api } from "../src/api/client";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await api.login({ email, password });
      Alert.alert("Success", "Login successful");

      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SmartPark Login</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.btn} onPress={handleLogin}>
        <Text style={{ color: "#fff" }}>Login</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/signup")}>
        <Text style={{ marginTop: 20 }}>Create account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 26, marginBottom: 20, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
  },
  btn: {
    backgroundColor: "black",
    padding: 14,
    alignItems: "center",
    borderRadius: 8,
  },
});