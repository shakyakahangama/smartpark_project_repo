import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { api } from "../../src/api/client";

export default function DisplayReservation() {
  const params = useLocalSearchParams();
  const email = typeof params.email === "string" ? params.email : "";

  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    loadReservations();
  }, [email]);

  async function loadReservations() {
    try {
      if (!email) {
        setReservations([]);
        return;
      }

      setLoading(true);

      // ✅ load from API client
      const data = await api.listReservations(email);

      // ✅ IMPORTANT: remove cancelled/completed reservations from UI
      const onlyActive = (data || []).filter((r) => r.status === "active");

      setReservations(onlyActive);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", err.message || "Failed to load reservations");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(reservationId) {
    Alert.alert(
      "Cancel Reservation",
      "Are you sure you want to cancel this reservation?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await api.cancelReservation({ reservation_id: reservationId });

              // ✅ remove it immediately from UI (no need to wait refresh)
              setReservations((prev) => prev.filter((r) => r.id !== reservationId));

              Alert.alert("Success ✅", "Reservation cancelled");
            } catch (err) {
              Alert.alert("Error", err.message || "Cancel failed");
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <LinearGradient
        colors={["#071a3a", "#243b63", "#b9b9b9"]}
        style={styles.bg}
      >
        <ActivityIndicator size="large" color="white" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#071a3a", "#243b63", "#b9b9b9"]}
      style={styles.bg}
    >
      <Text style={styles.title}>My Reservations</Text>

      {reservations.length === 0 ? (
        <Text style={styles.empty}>No active reservations</Text>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* NOTE: Your backend currently may not return slot/plate.
                  So we safely show "-" if missing. */}
              <Text style={styles.slot}>Slot: {item.slot || "-"}</Text>
              <Text style={styles.text}>Plate: {item.plate || "-"}</Text>

              <Text style={styles.text}>Start: {item.start_time}</Text>
              <Text style={styles.text}>End: {item.end_time}</Text>

              <Text style={styles.status}>Status: {item.status}</Text>

              {/* ✅ Cancel button */}
              <Pressable
                style={styles.deleteBtn}
                onPress={() => handleCancel(item.id)}
              >
                <Text style={styles.deleteText}>Cancel</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      <Pressable style={styles.refreshBtn} onPress={loadReservations}>
        <Text style={styles.refreshText}>Refresh</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },

  title: {
    color: "white",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 20,
    textAlign: "center",
  },

  empty: {
    color: "white",
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#0b1d44",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  slot: {
    color: "#00ffcc",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },

  text: {
    color: "white",
    marginBottom: 4,
  },

  status: {
    color: "#ffd700",
    marginTop: 6,
    fontWeight: "bold",
  },

  deleteBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255, 0, 0, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,0,0,0.6)",
  },

  deleteText: {
    color: "white",
    fontWeight: "900",
  },

  refreshBtn: {
    marginTop: 10,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(11,29,68,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },

  refreshText: {
    color: "white",
    fontWeight: "900",
  },
});