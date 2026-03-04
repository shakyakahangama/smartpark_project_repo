// app/(tabs)/vehicle-details.js
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import GradientScreen from "../../components/GradientScreen";
import TopBar from "../../components/TopBar";
import TextField from "../../components/TextField";
import PrimaryButton from "../../components/PrimaryButton";
import { api } from "../../src/api/client";
import { session } from "../../src/api/store/session";

const DOORS = ["Swing doors", "Sliding doors", "Vertical doors"];

export default function VehicleDetails() {
  const user = session.getUser();
  const email = user?.email;

  const [plate, setPlate] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState(""); // UI only (backend doesn't store height)
  const [door, setDoor] = useState("Swing doors");
  const [agree, setAgree] = useState(false);

  async function onSubmit() {
    if (!email) return Alert.alert("Error", "Not logged in.");
    if (!plate || !length || !width || !agree) {
      Alert.alert("Error", "Fill plate, length, width and agree to terms.");
      return;
    }

    try {
      await api.saveVehicleDetails({
        email,
        plate_number: plate,
        length_m: Number(length),
        width_m: Number(width),
        height_m: height ? Number(height) : null,
        door_opening_type: door,
        terms_accepted: true,
      });

      Alert.alert("Success", "Vehicle details saved.");
      router.back();
    } catch (e) {
      Alert.alert("Failed", e.message);
    }
  }

  return (
    <GradientScreen>
      <TopBar title="" onBack={() => router.back()} />

      <Text style={styles.title}>VEHICLE DETAILS</Text>

      <Text style={styles.lbl}>VEHICLE PLATE NUMBER:</Text>
      <TextField value={plate} onChangeText={setPlate} placeholder="ABC-1234" />

      <Text style={styles.lbl}>DIMENSIONS OF THE VEHICLE:</Text>
      <TextField value={length} onChangeText={setLength} placeholder="LENGTH:" keyboardType="numeric" />
      <TextField value={width} onChangeText={setWidth} placeholder="WIDTH:" keyboardType="numeric" />
      <TextField value={height} onChangeText={setHeight} placeholder="HEIGHT:" keyboardType="numeric" />

      <Text style={styles.lbl}>VEHICLE DOOR OPENNING TYPE:</Text>

      {DOORS.map((d) => (
        <Pressable key={d} onPress={() => setDoor(d)} style={styles.option}>
          <View style={[styles.cb, door === d && styles.cbOn]} />
          <Text style={styles.optTxt}>{d.toUpperCase()}</Text>
        </Pressable>
      ))}

      <Text style={[styles.lbl, { marginTop: 16 }]}>I AGREE TO THE TERMS & CONDITIONS: *</Text>
      <Pressable onPress={() => setAgree(!agree)} style={styles.terms}>
        <View style={[styles.cb, agree && styles.cbOn]} />
      </Pressable>

      <View style={{ marginTop: 20 }}>
        <PrimaryButton title="SUBMIT" onPress={onSubmit} />
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  title: { color: "white", fontSize: 26, letterSpacing: 2, textAlign: "center", marginVertical: 12, fontWeight: "600" },
  lbl: { color: "#ddd", marginTop: 14, fontSize: 11, letterSpacing: 1 },
  option: {
    backgroundColor: "white",
    borderRadius: 18,
    height: 44,
    marginTop: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  cb: { width: 14, height: 14, borderRadius: 3, borderWidth: 1, borderColor: "#333" },
  cbOn: { backgroundColor: "#061a44" },
  optTxt: { color: "#111", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  terms: {
    backgroundColor: "#b48f90",
    height: 44,
    borderRadius: 18,
    marginTop: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
});