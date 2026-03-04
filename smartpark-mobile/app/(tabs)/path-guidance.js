// app/(tabs)/path-guidance.js
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import GradientScreen from "../../components/GradientScreen";
import TopBar from "../../components/TopBar";
import PrimaryButton from "../../components/PrimaryButton";
import { session } from "../../src/api/store/session";
import { api } from "../../src/api/client";

export default function PathGuidance() {
  const [slot, setSlot] = useState(null);
  const [instructions, setInstructions] = useState([]);
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);
  const intervalRef = useRef(null);

  // ── Load slot + instructions ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Try saved last reservation
      let slotCode = null;
      const last = await session.getLastReservation();
      slotCode = last?.slot || null;

      // 2. Fallback: ask the backend for the user's active reservation
      if (!slotCode) {
        const user = session.getUser();
        if (user?.email) {
          const reservations = await api.listReservations(user.email);
          if (reservations?.length > 0) {
            slotCode = reservations[0].slot;
            // Save it so next time we don't need to re-fetch
            await session.setLastReservation(reservations[0]);
          }
        }
      }

      if (!slotCode) {
        setError("No active reservation found.\nPlease make a reservation first.");
        setLoading(false);
        return;
      }

      setSlot(slotCode);
      setImgError(false);

      // 3. Fetch turn-by-turn instructions
      const guidanceData = await api.guidance(slotCode);
      const steps = guidanceData?.instructions || [];
      if (steps.length === 0) {
        setError("Guidance not available for slot " + slotCode);
      } else {
        setInstructions(steps);
      }
    } catch (e) {
      setError("Could not load guidance.\n" + (e?.message || String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Poll new snapshot every 600 ms for a live-ish feed
    intervalRef.current = setInterval(() => setTick((t) => t + 1), 600);
    return () => clearInterval(intervalRef.current);
  }, [loadData]);

  function endParking() {
    clearInterval(intervalRef.current);
    Alert.alert("Parking", "Your parking session is complete.");
    router.replace("/(tabs)/home");
  }

  // ── Camera snapshot URL ───────────────────────────────────────────────────
  const snapshotUri = slot
    ? `${api.videoSnapshotUrl(slot)}&_t=${tick}`
    : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <GradientScreen>
      <TopBar title="" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>PATH GUIDANCE</Text>
        <Text style={styles.small}>FOLLOW THE LIVE CAM TO YOUR ALLOCATED SLOT</Text>

        {/* ── Loading spinner ── */}
        {loading && (
          <View style={styles.centreBox}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading guidance…</Text>
          </View>
        )}

        {/* ── Error state ── */}
        {!loading && error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Success state ── */}
        {!loading && !error && slot && (
          <>
            {/* Slot badge */}
            <View style={styles.slotBadge}>
              <Text style={styles.slotBadgeLabel}>YOUR SLOT</Text>
              <Text style={styles.slotBadgeCode}>{slot}</Text>
            </View>

            {/* Live camera feed */}
            <View style={styles.mapBox}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>

              {snapshotUri && !imgError ? (
                <Image
                  key={tick}
                  source={{ uri: snapshotUri, cache: "reload" }}
                  style={styles.camImage}
                  resizeMode="cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <View style={styles.camFallback}>
                  <Text style={styles.camFallbackIcon}>📷</Text>
                  <Text style={styles.camFallbackText}>
                    Camera unavailable{"\n"}Make sure the backend is running on your PC
                  </Text>
                  <TouchableOpacity
                    onPress={() => setImgError(false)}
                    style={styles.retryBtn}
                  >
                    <Text style={styles.retryText}>Retry Camera</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Turn-by-turn instructions */}
            {instructions.length > 0 && (
              <View style={styles.instructionBox}>
                <Text style={styles.instructionHeader}>🗺️ TURN-BY-TURN</Text>
                {instructions.map((step, idx) => (
                  <View key={idx} style={styles.stepRow}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ marginTop: 20, marginBottom: 10 }}>
          <PrimaryButton title="END THE PARKING" onPress={endParking} />
        </View>
      </ScrollView>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  title: {
    color: "white",
    fontSize: 24,
    letterSpacing: 2,
    textAlign: "center",
    marginVertical: 6,
    fontWeight: "700",
  },
  small: {
    color: "#aaa",
    textAlign: "center",
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 12,
  },

  // Loading
  centreBox: {
    alignItems: "center",
    marginTop: 60,
    gap: 12,
  },
  loadingText: {
    color: "#aaa",
    fontSize: 13,
  },

  // Error
  errorBox: {
    alignItems: "center",
    backgroundColor: "rgba(255,60,60,0.12)",
    borderRadius: 14,
    padding: 24,
    marginTop: 30,
    gap: 10,
  },
  errorIcon: {
    fontSize: 36,
  },
  errorText: {
    color: "#ffaaaa",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 6,
    backgroundColor: "rgba(124,58,237,0.7)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },

  // Slot badge
  slotBadge: {
    backgroundColor: "rgba(124,58,237,0.25)",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.5)",
  },
  slotBadgeLabel: {
    color: "#aaa",
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 2,
  },
  slotBadgeCode: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 4,
  },

  // Camera
  mapBox: {
    backgroundColor: "#111",
    borderRadius: 16,
    height: 230,
    overflow: "hidden",
    marginBottom: 14,
  },
  camImage: {
    width: "100%",
    height: "100%",
  },
  camFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
  },
  camFallbackIcon: {
    fontSize: 40,
  },
  camFallbackText: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  liveBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(220,38,38,0.85)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 10,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginRight: 5,
  },
  liveText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Instructions
  instructionBox: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  instructionHeader: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(124,58,237,0.7)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  stepText: {
    color: "#ddd",
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
});