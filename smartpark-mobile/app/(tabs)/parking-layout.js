import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, FlatList } from "react-native";
import GradientScreen from "../../components/GradientScreen";
import TopBar from "../../components/TopBar";
import { api } from "../../src/api/client";

const COLUMNS = 4;

export default function ParkingLayout() {
  const [slots, setSlots] = useState([]);

  async function loadSlots() {
    try {
      const res = await api.getSlotStatus();
      setSlots(res || []);
    } catch (e) {
      console.log("Slot error:", e.message);
    }
  }

  useEffect(() => {
    loadSlots();
    const interval = setInterval(loadSlots, 3000);
    return () => clearInterval(interval);
  }, []);

  function getColor(status) {
    if (status === "available") return "#4CAF50";
    if (status === "occupied") return "#F44336";
    if (status === "reserved") return "#FFC107";
    return "#ccc";
  }

  return (
    <GradientScreen>
      <TopBar title="Parking Layout" />
      <Text style={styles.title}>LIVE SLOT STATUS</Text>

      <FlatList
        data={slots}
        keyExtractor={(item) => item.slot_code}
        numColumns={COLUMNS}
        renderItem={({ item }) => (
          <View style={[styles.box, { backgroundColor: getColor(item.status) }]}>
            <Text style={styles.text}>{item.slot_code}</Text>
          </View>
        )}
      />
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: "white",
    fontSize: 20,
    textAlign: "center",
    marginVertical: 12,
  },
  box: {
    flex: 1,
    margin: 8,
    height: 80,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "white",
    fontWeight: "bold",
  },
});