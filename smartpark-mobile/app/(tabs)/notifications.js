// app/(tabs)/notifications.js
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import GradientScreen from "../../components/GradientScreen";
import TopBar from "../../components/TopBar";
import { api } from "../../src/api/client";
import { session } from "../../src/api/store/session";

export default function Notifications() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const user = session.getUser();
        const data = await api.notifications(user.email);
        setItems(data || []);
      } catch (e) {
        Alert.alert("Error", e.message);
      }
    })();
  }, []);

  return (
    <GradientScreen>
      <TopBar title="" onBack={() => router.back()} />
      <Text style={styles.title}>NOTIFICATIONS</Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {items.map((n) => (
          <View key={n.id} style={styles.card}>
            <Text style={styles.cardTitle}>{String(n.title || "").toUpperCase()}</Text>
            <Text style={styles.cardMsg}>{n.message}</Text>
            <Text style={styles.cardTime}>{String(n.created_at || "")}</Text>
          </View>
        ))}
        {!items.length && (
          <Text style={{ color: "#ddd", textAlign: "center", marginTop: 40 }}>
            No notifications yet.
          </Text>
        )}
      </ScrollView>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  title: { color: "white", fontSize: 26, letterSpacing: 2, textAlign: "center", marginVertical: 10, fontWeight: "600" },
  card: {
    backgroundColor: "#b48f90",
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
  },
  cardTitle: { fontWeight: "900", letterSpacing: 1, color: "#111" },
  cardMsg: { color: "#111", marginTop: 6, fontWeight: "600" },
  cardTime: { color: "#eee", marginTop: 10, fontWeight: "700" },
});