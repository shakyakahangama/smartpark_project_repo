import React, { useEffect, useState } from "react";
import { Text, StyleSheet, View, ActivityIndicator, Pressable, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { api } from "../../src/api/client";

export default function PathGuidance() {
  const params = useLocalSearchParams();
  const slot = typeof params.slot === "string" ? params.slot : "";

  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState([]);
  const [distance, setDistance] = useState(null);
  const [error, setError] = useState("");

  async function loadGuidance() {
    try {
      if (!slot) {
        setError("No slot received. Please create a reservation first.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const data = await api.guidance(slot);

      setPath(data.path || []);
      setDistance(data.distance ?? null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGuidance();
  }, [slot]);

  return (
    <LinearGradient
      colors={["#071a3a", "#243b63", "#b9b9b9"]}
      style={styles.bg}
    >
      <Text style={styles.title}>PATH GUIDANCE</Text>

      <Text style={styles.slotText}>
        Reserved Slot: <Text style={{ fontWeight: "900" }}>{slot || "N/A"}</Text>
      </Text>

      {/* MAP PLACEHOLDER */}
      <View style={styles.mapBox}>
        {loading ? (
          <>
            <ActivityIndicator size="large" color="#071a3a" />
            <Text style={styles.subText}>Loading path...</Text>
          </>
        ) : error ? (
          <>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={loadGuidance}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.mapText}>🗺 Route Generated ✅</Text>
            <Text style={styles.subText}>
              (Live map + camera AI can be added later)
            </Text>
          </>
        )}
      </View>

      {/* PATH DETAILS */}
      {!loading && !error && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Instructions</Text>

          {distance !== null && (
            <Text style={styles.distance}>Distance Score: {distance}</Text>
          )}

          {path.map((node, i) => (
            <Text key={i} style={styles.step}>
              {i + 1}. Go to {node}
            </Text>
          ))}
        </View>
      )}

      <Text style={styles.info}>
        Follow the route steps to reach your reserved slot.
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, paddingHorizontal: 22, paddingTop: 60 },

  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },

  slotText: {
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 16,
    fontSize: 15,
    fontWeight: "700",
  },

  mapBox: {
    height: 220,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  mapText: { fontSize: 18, fontWeight: "900", color: "#071a3a" },
  subText: { marginTop: 8, fontSize: 13, opacity: 0.7, textAlign: "center" },

  errorText: {
    color: "#b00020",
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
  },

  retryBtn: {
    backgroundColor: "#071a3a",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  retryText: { color: "white", fontWeight: "900" },

  card: {
    marginTop: 18,
    backgroundColor: "#0b1d44",
    borderRadius: 18,
    padding: 16,
  },
  cardTitle: { color: "white", fontSize: 16, fontWeight: "900", marginBottom: 10 },
  distance: { color: "rgba(255,255,255,0.85)", marginBottom: 10, fontWeight: "700" },
  step: { color: "white", marginBottom: 8, fontWeight: "700" },

  info: {
    color: "white",
    marginTop: 18,
    fontSize: 15,
    textAlign: "center",
    fontWeight: "600",
    opacity: 0.9,
  },
});