import React, { useEffect, useState } from "react";
import { Text, StyleSheet, TextInput, Pressable, Alert, FlatList } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { api } from "../../src/api/client";

export default function ReservationDetails() {
  const params = useLocalSearchParams();
  const email = typeof params.email === "string" ? params.email : "";

  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  async function loadVehicles() {
    try {
      if (!email) return;

      const list = await api.listVehicles(email);
      setVehicles(list || []);

      // auto pick first vehicle if exists
      if ((list || []).length > 0) {
        setVehicleId(String(list[0].id));
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  }

  useEffect(() => {
    loadVehicles();
  }, [email]);

  async function handleReserve() {
    try {
      if (!email) return Alert.alert("Error", "Email missing. Login again.");
      if (!vehicleId) return Alert.alert("Error", "Select a vehicle first.");
      if (!start || !end) return Alert.alert("Error", "Enter start and end time.");

      // backend expects HH:MM (colon). you typed 11.00 -> convert dot to colon
      const cleanStart = start.trim().replace(".", ":");
      const cleanEnd = end.trim().replace(".", ":");

      const res = await api.createReservation({
        email,
        vehicle_id: Number(vehicleId),
        start_time: cleanStart,
        end_time: cleanEnd,
      });

      Alert.alert("Success ✅", `Slot Allocated: ${res.slot}`);
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  }

  return (
    <LinearGradient colors={["#071a3a", "#243b63", "#b9b9b9"]} style={styles.bg}>
      <Text style={styles.title}>Create Reservation</Text>
      <Text style={styles.small}>Email: {email || "(missing)"}</Text>

      <Text style={styles.sectionTitle}>Your Vehicles (Tap one)</Text>

      {vehicles.length === 0 ? (
        <Text style={styles.small}>No vehicles found. Add a vehicle first.</Text>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => String(item.id)}
          style={{ marginBottom: 10 }}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.vehicleCard,
                String(item.id) === String(vehicleId) && styles.activeCard,
              ]}
              onPress={() => setVehicleId(String(item.id))}
            >
              <Text style={styles.vehicleText}>
                ID: {item.id} | {item.plate_number} | {item.vehicle_type}
              </Text>
              <Text style={styles.vehicleSub}>
                {item.length_m}m × {item.width_m}m
              </Text>
            </Pressable>
          )}
        />
      )}

      <TextInput
        style={styles.input}
        value={vehicleId}
        editable={false}
        placeholder="Selected Vehicle ID"
        placeholderTextColor="#aaa"
      />

      <TextInput
        style={styles.input}
        placeholder="Start (YYYY-MM-DD HH:MM) e.g. 2026-02-05 11:00"
        placeholderTextColor="#aaa"
        value={start}
        onChangeText={setStart}
      />

      <TextInput
        style={styles.input}
        placeholder="End (YYYY-MM-DD HH:MM) e.g. 2026-02-05 12:00"
        placeholderTextColor="#aaa"
        value={end}
        onChangeText={setEnd}
      />

      <Pressable style={styles.btn} onPress={handleReserve}>
        <Text style={styles.btnText}>RESERVE SLOT</Text>
      </Pressable>

      <Pressable style={styles.secondaryBtn} onPress={loadVehicles}>
        <Text style={styles.secondaryText}>Refresh Vehicles</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, padding: 20, paddingTop: 60 },
  title: { color: "white", fontSize: 26, fontWeight: "900", textAlign: "center", marginBottom: 6 },
  small: { color: "white", textAlign: "center", opacity: 0.8, marginBottom: 10 },
  sectionTitle: { color: "white", fontWeight: "900", marginBottom: 10 },

  vehicleCard: { backgroundColor: "#0b1d44", borderRadius: 14, padding: 12, marginBottom: 10 },
  activeCard: { borderWidth: 2, borderColor: "#fff" },
  vehicleText: { color: "white", fontWeight: "800" },
  vehicleSub: { color: "white", opacity: 0.8, marginTop: 4 },

  input: { backgroundColor: "#0b1d44", height: 50, borderRadius: 12, marginBottom: 12, paddingHorizontal: 12, color: "white" },
  btn: { backgroundColor: "#071a3a", height: 55, borderRadius: 16, justifyContent: "center", alignItems: "center", marginTop: 6 },
  btnText: { color: "white", fontWeight: "900", fontSize: 16 },

  secondaryBtn: { marginTop: 10, height: 44, borderRadius: 14, backgroundColor: "rgba(11,29,68,0.65)", justifyContent: "center", alignItems: "center" },
  secondaryText: { color: "white", fontWeight: "800" },
});