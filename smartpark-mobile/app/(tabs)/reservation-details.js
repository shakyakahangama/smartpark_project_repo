// app/(tabs)/reservation-details.js

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import GradientScreen from "../../components/GradientScreen";
import TopBar from "../../components/TopBar";
import PrimaryButton from "../../components/PrimaryButton";
import { api } from "../../src/api/client";
import { session } from "../../src/api/store/session";

export default function ReservationDetails() {
  const user = useMemo(() => session.getUser(), []);
  const email = user?.email;

  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState(null);
  const [selectedPlate, setSelectedPlate] = useState("");
  const [loading, setLoading] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    (async () => {
      if (!email) return;

      try {
        setLoading(true);
        const list = await api.listVehicles(email);

        setVehicles(list);

        if (list.length > 0) {
          setVehicleId(list[0].id);
          setSelectedPlate(list[0].plate_number);
        } else {
          Alert.alert("No Vehicles", "Please add vehicle details first.");
        }
      } catch (e) {
        Alert.alert("Error", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [email]);

  function combineDateTime(d, t) {
    const dt = new Date(d);
    dt.setHours(t.getHours());
    dt.setMinutes(t.getMinutes());
    dt.setSeconds(0);
    return dt;
  }

  async function onSubmit() {
    if (!email) return Alert.alert("Error", "Not logged in.");
    if (!vehicleId) return Alert.alert("Error", "Please select a vehicle.");

    const start = combineDateTime(date, time);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    try {
      const payload = {
        email,
        vehicle_id: vehicleId,
        start_time: formatDT(start),
        end_time: formatDT(end),
      };

      const res = await api.createReservation(payload);

      router.push({
        pathname: "/(tabs)/reservation-confirmation",
        params: {
          slot: res?.slot,
          reservation_id: res?.reservation_id,
          start_time: res?.start_time,
          end_time: res?.end_time,
          vehicle_id: vehicleId,
        },
      });
    } catch (e) {
      Alert.alert("Reservation Failed", e.message);
    }
  }

  return (
    <GradientScreen>
      <TopBar title="Hello user" onBack={() => router.back()} />

      <Text style={styles.title}>RESERVATION DETAILS</Text>

      <Text style={styles.lbl}>DATE:</Text>
      <View style={styles.pinkRow}>
        <DateTimePicker
          value={date}
          mode="date"
          onChange={(_, v) => v && setDate(v)}
        />
      </View>

      <Text style={styles.lbl}>TIME:</Text>
      <View style={styles.pinkRow}>
        <DateTimePicker
          value={time}
          mode="time"
          onChange={(_, v) => v && setTime(v)}
        />
      </View>

      <Text style={styles.lbl}>VEHICLE PLATE NUMBER:</Text>

      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setDropdownVisible(true)}
        >
          <Text style={styles.dropdownText}>
            {selectedPlate || "Select Vehicle"}
          </Text>
        </TouchableOpacity>
      )}

      <PrimaryButton title="SUBMIT" onPress={onSubmit} />

      {/* MODAL DROPDOWN */}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <FlatList
              data={vehicles}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    setVehicleId(item.id);
                    setSelectedPlate(item.plate_number);
                    setDropdownVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>
                    {item.plate_number}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              onPress={() => setDropdownVisible(false)}
              style={styles.closeBtn}
            >
              <Text style={{ color: "white" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </GradientScreen>
  );
}

function formatDT(dt) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(
    dt.getDate()
  )} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

const styles = StyleSheet.create({
  title: {
    color: "white",
    fontSize: 26,
    textAlign: "center",
    marginVertical: 12,
    fontWeight: "600",
  },
  lbl: {
    color: "#ddd",
    marginTop: 16,
    fontSize: 11,
    letterSpacing: 1,
  },
  pinkRow: {
    backgroundColor: "#b48f90",
    borderRadius: 18,
    padding: 6,
    marginTop: 10,
  },
  dropdown: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
  },
  dropdownText: {
    color: "#000",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBox: {
    backgroundColor: "#061a44",
    margin: 20,
    borderRadius: 12,
    padding: 15,
  },
  option: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  optionText: {
    color: "white",
  },
  closeBtn: {
    marginTop: 10,
    alignItems: "center",
  },
});