import React, { useState } from "react";
import { Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { api } from "../../src/api/client";

export default function VehicleDetails() {
  // get email from navigation
  const params = useLocalSearchParams();
  const email = typeof params.email === "string" ? params.email : "";

  const [plate, setPlate] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [lengthM, setLengthM] = useState("");
  const [widthM, setWidthM] = useState("");

  const addVehicle = async () => {
    if (!email) {
      Alert.alert("Error", "Email missing. Please login again.");
      return;
    }

    if (!plate || !vehicleType || !lengthM || !widthM) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    const lengthNum = Number(lengthM);
    const widthNum = Number(widthM);

    if (isNaN(lengthNum) || isNaN(widthNum)) {
      Alert.alert("Error", "Length & Width must be numbers");
      return;
    }

    try {
      await api.addVehicle({
        email: email,
        plate_number: plate.trim(),
        vehicle_type: vehicleType.trim(),
        length_m: lengthNum,
        width_m: widthNum,
      });

      Alert.alert("Success ✅", "Vehicle added!");
      setPlate("");
      setVehicleType("");
      setLengthM("");
      setWidthM("");
    } catch (err) {
      Alert.alert("Error", err.message);
      console.log(err);
    }
  };

  return (
    <LinearGradient colors={["#071a3a", "#243b63", "#b9b9b9"]} style={styles.bg}>
      <Text style={styles.title}>Add Vehicle</Text>

      {/* Debug email */}
      <Text style={styles.debug}>Email: {email || "(missing)"}</Text>

      <TextInput
        style={styles.input}
        placeholder="Plate Number"
        placeholderTextColor="#aaa"
        value={plate}
        onChangeText={setPlate}
      />

      <TextInput
        style={styles.input}
        placeholder="Vehicle Type"
        placeholderTextColor="#aaa"
        value={vehicleType}
        onChangeText={setVehicleType}
      />

      <TextInput
        style={styles.input}
        placeholder="Length (m)"
        placeholderTextColor="#aaa"
        keyboardType="numeric"
        value={lengthM}
        onChangeText={setLengthM}
      />

      <TextInput
        style={styles.input}
        placeholder="Width (m)"
        placeholderTextColor="#aaa"
        keyboardType="numeric"
        value={widthM}
        onChangeText={setWidthM}
      />

      <Pressable style={styles.btn} onPress={addVehicle}>
        <Text style={styles.btnText}>ADD VEHICLE</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    padding: 22,
    paddingTop: 60,
  },

  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
  },

  debug: {
    color: "white",
    textAlign: "center",
    marginBottom: 14,
    opacity: 0.8,
  },

  input: {
    height: 50,
    borderRadius: 14,
    backgroundColor: "#0b1d44",
    marginBottom: 12,
    paddingHorizontal: 12,
    color: "white",
  },

  btn: {
    height: 55,
    borderRadius: 18,
    backgroundColor: "#071a3a",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  btnText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },
});