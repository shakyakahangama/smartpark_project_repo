// app/(tabs)/display-reservation.js
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import GradientScreen from "../../components/GradientScreen";
import TopBar from "../../components/TopBar";
import { session } from "../../src/api/store/session";
import { api } from "../../src/api/client";

export default function DisplayReservation() {
  const [data, setData] = useState(null);
  const [vehicle, setVehicle] = useState(null);

  useEffect(() => {
    (async () => {
      const last = await session.getLastReservation();
      setData(last);

      const email = last?.user?.email;
      if (email) {
        const vehicles = await api.listVehicles(email);
        const v = vehicles.find((x) => String(x.id) === String(last.vehicleId));
        setVehicle(v || null);
      }
    })();
  }, []);

  if (!data) {
    return (
      <GradientScreen>
        <TopBar title="" onBack={() => router.back()} />
        <Text style={{ color: "white", textAlign: "center", marginTop: 30 }}>
          No reservation to display yet.
        </Text>
      </GradientScreen>
    );
  }

  const u = data.user;

  return (
    <GradientScreen>
      <TopBar title="" onBack={() => router.back()} />
      <Text style={styles.title}>RESERVATION DETAILS</Text>

      <View style={styles.statusRow}>
        <Text style={styles.status}>STATUS : CONFIRMED</Text>
        <View style={styles.ok} />
      </View>

      <View style={styles.card}>
        <Text style={styles.h}>USER INFORMATION</Text>
        <Text style={styles.line}>Name : {u?.name}</Text>
        <Text style={styles.line}>Email : {u?.email}</Text>
        <Text style={styles.line}>Contact Number : {u?.contact_number || u?.contact || "-"}</Text>

        <Text style={[styles.h, { marginTop: 14 }]}>VEHICLE DETAILS</Text>
        <Text style={styles.line}>Plate Number : {vehicle?.plate_number || "-"}</Text>
        <Text style={styles.line}>
          Dimensions of the vehicle : {vehicle?.length || "-"} m × {vehicle?.width || "-"} m
        </Text>
        <Text style={styles.line}>Vehicle door opening type : {vehicle?.door_type || "-"}</Text>

        <Text style={[styles.h, { marginTop: 14 }]}>RESERVATION DETAILS</Text>
        <Text style={styles.line}>Start : {data.startTime}</Text>
        <Text style={styles.line}>End : {data.endTime}</Text>
        <Text style={styles.line}>Confirmed Space : {data.slot}</Text>
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  title: { color: "white", fontSize: 24, letterSpacing: 2, textAlign: "center", marginVertical: 10, fontWeight: "600" },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 10 },
  status: { color: "#ddd", letterSpacing: 1, fontWeight: "700" },
  ok: { width: 18, height: 18, borderRadius: 18, backgroundColor: "#20c05c" },
  card: { backgroundColor: "white", borderRadius: 16, padding: 16, marginTop: 10 },
  h: { fontWeight: "800", letterSpacing: 1, marginBottom: 6, color: "#333" },
  line: { color: "#333", marginTop: 4, fontWeight: "600" },
});