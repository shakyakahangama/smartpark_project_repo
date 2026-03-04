// app/(tabs)/reservation-confirmation.js
import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import GradientScreen from "../../components/GradientScreen";
import TopBar from "../../components/TopBar";
import PrimaryButton from "../../components/PrimaryButton";
import { session } from "../../src/api/store/session";
import { api } from "../../src/api/client";

export default function ReservationConfirmation() {
  const p = useLocalSearchParams();
  const slot = String(p.slot || "");
  const reservationId = String(p.reservation_id || "");
  const vehicleId = String(p.vehicle_id || "");
  const startTime = String(p.start_time || "");
  const endTime = String(p.end_time || "");

  async function onConfirm() {
    const user = session.getUser();
    if (!user) return;

    // Save locally for Display Reservation screen
    await session.setLastReservation({
      slot,
      reservationId,
      vehicleId,
      startTime,
      endTime,
      user,
    });

    router.replace("/(tabs)/display-reservation");
  }

  async function onCancel() {
    // Optional: call backend cancel endpoint if you want
    // backend supports POST /reservation/cancel with {reservation_id} :contentReference[oaicite:3]{index=3}
    if (!reservationId) return router.back();

    try {
      await api.createReservation; // no-op (avoid lint). remove if you add cancel in client.
      // If you want cancel working, tell me and I’ll add api.cancelReservation() properly.
      router.back();
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  }

  return (
    <GradientScreen>
      <TopBar title="" onBack={() => router.back()} />
      <Text style={styles.title}>CONFIRM THE RESERVATION</Text>

      <Text style={styles.small}>AVAILABLE PARKING SPACE ACCORDING TO YOUR VEHICLE:</Text>

      <View style={styles.pill}>
        <Text style={styles.slot}>{slot || "A10"}</Text>
      </View>

      <View style={styles.row}>
        <PrimaryButton title="CANCEL" onPress={onCancel} style={{ flex: 1, marginRight: 10 }} />
        <PrimaryButton title="CONFIRM" onPress={onConfirm} style={{ flex: 1, marginLeft: 10 }} />
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  title: { color: "white", fontSize: 24, letterSpacing: 2, textAlign: "center", marginVertical: 14, fontWeight: "600" },
  small: { color: "#ddd", marginTop: 18, fontSize: 10, letterSpacing: 1, textAlign: "center" },
  pill: { backgroundColor: "#b48f90", borderRadius: 18, height: 44, marginTop: 14, alignItems: "center", justifyContent: "center" },
  slot: { fontSize: 18, fontWeight: "800", letterSpacing: 2, color: "#111" },
  row: { flexDirection: "row", marginTop: 30 },
});