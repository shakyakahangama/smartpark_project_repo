import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { api } from "../../src/api/client";

export default function DisplayReservation() {
  const { email } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    loadReservations();
  }, []);

  async function loadReservations() {
    try {
      const res = await fetch(
        `http://172.20.10.4:5000/reservation/list/${encodeURIComponent(email)}`
      );

      const data = await res.json();
      setReservations(data);
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <LinearGradient colors={["#071a3a", "#243b63", "#b9b9b9"]} style={styles.bg}>
        <ActivityIndicator size="large" color="white" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#071a3a", "#243b63", "#b9b9b9"]} style={styles.bg}>
      <Text style={styles.title}>My Reservations</Text>

      {reservations.length === 0 ? (
        <Text style={styles.empty}>No reservations yet</Text>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.slot}>Slot: {item.slot}</Text>
              <Text style={styles.text}>Plate: {item.plate}</Text>
              <Text style={styles.text}>Start: {item.start_time}</Text>
              <Text style={styles.text}>End: {item.end_time}</Text>
              <Text style={styles.status}>Status: {item.status}</Text>
            </View>
          )}
        />
      )}
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
});