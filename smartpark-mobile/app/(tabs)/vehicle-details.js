import React, { useState } from "react";
import { Text, TextInput, StyleSheet, Alert, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { api } from "../../src/api/client";


export default function VehicleDetails() {
  const { email } = useLocalSearchParams();
  const [plate, setPlate] = useState("");
  const [type, setType] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");

  async function addVehicle() {
    if (!plate || !type || !length || !width) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    try {
      await api.addVehicle({
        email,
        plate_number: plate,
        vehicle_type: type,
        length_m: Number(length),
        width_m: Number(width),
      });

      Alert.alert("Success ✅", "Vehicle added");
      setPlate(""); setType(""); setLength(""); setWidth("");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  }

  return (
    <LinearGradient colors={["#071a3a", "#243b63", "#b9b9b9"]} style={styles.bg}>
      <Text style={styles.title}>Vehicle Details</Text>

      <Input label="Plate Number" value={plate} setValue={setPlate} />
      <Input label="Vehicle Type" value={type} setValue={setType} />
      <Input label="Length (m)" value={length} setValue={setLength} numeric />
      <Input label="Width (m)" value={width} setValue={setWidth} numeric />

      <Pressable style={styles.btn} onPress={addVehicle}>
        <Ionicons name="add-circle" size={22} color="white" />
        <Text style={styles.btnText}>Add Vehicle</Text>
      </Pressable>
    </LinearGradient>
  );
}

function Input({ label, value, setValue, numeric }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        keyboardType={numeric ? "numeric" : "default"}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, padding: 24, paddingTop: 60 },
  title: { color: "white", fontSize: 28, fontWeight: "900", marginBottom: 20 },
  label: { color: "#eee", fontWeight: "700", marginTop: 14 },
  input: {
    height: 50,
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 14,
    marginTop: 6,
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
