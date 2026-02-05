import React, { useState } from "react";
import { Text, TextInput, StyleSheet, Alert, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function ReservationDetails() {
  const [vehicleId, setVehicleId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  function reserve() {
    if (!vehicleId || !start || !end) {
      Alert.alert("Error", "All fields required");
      return;
    }
    Alert.alert("Success ✅", "Slot reserved (mock)");
  }

  return (
    <LinearGradient colors={["#071a3a", "#243b63", "#b9b9b9"]} style={styles.bg}>
      <Text style={styles.title}>Reservation</Text>

      <Input label="Vehicle ID" value={vehicleId} setValue={setVehicleId} />
      <Input label="Start Time" value={start} setValue={setStart} />
      <Input label="End Time" value={end} setValue={setEnd} />

      <Pressable style={styles.btn} onPress={reserve}>
        <Ionicons name="checkmark-circle" size={22} color="white" />
        <Text style={styles.btnText}>Reserve Slot</Text>
      </Pressable>
    </LinearGradient>
  );
}

function Input({ label, value, setValue }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={setValue} />
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, padding: 24, paddingTop: 60 },
  title: { color: "white", fontSize: 28, fontWeight: "900" },
  label: { color: "#eee", marginTop: 16 },
  input: {
    height: 50,
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  btn: {
    marginTop: 32,
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
