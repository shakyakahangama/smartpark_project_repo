import React from "react";
import { Text, StyleSheet, Pressable, Image, ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function Home() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  return (
    <LinearGradient colors={["#071a3a", "#243b63", "#b9b9b9"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* TITLE */}
        <Text style={styles.title}>SMARTPARK</Text>
        <Text style={styles.subtitle}>Welcome back 🎉</Text>
        <Text style={styles.email}>Email: {email}</Text>

        {/* BIG CENTER LOGO ONLY */}
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.bigLogo}
        />

        {/* BUTTONS */}
        <View style={{ marginTop: 20 }}>
          <MenuCard
            icon="car-sport"
            text="Vehicle Details"
            onPress={() =>
              router.push({
                pathname: "/vehicle-details",
                params: { email },
              })
            }
          />

          <MenuCard
            icon="calendar"
            text="Reservation"
            onPress={() =>
              router.push({
                pathname: "/reservation-details",
                params: { email },
              })
            }
          />

          <MenuCard
            icon="list"
            text="Display Reservation"
            onPress={() =>
              router.push({
                pathname: "/display-reservation",
                params: { email },
              })
            }
          />

          <MenuCard
            icon="navigate"
            text="Path Guidance"
            onPress={() =>
              router.push({
                pathname: "/path-guidance",
                params: { email },
              })
            }
          />

          <MenuCard
            icon="chatbox-ellipses"
            text="Feedback"
            onPress={() =>
              router.push({
                pathname: "/feedback",
                params: { email },
              })
            }
          />
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

function MenuCard({ icon, text, onPress }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Ionicons name={icon} size={24} color="#fff" />
      <Text style={styles.cardText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingTop: 60,
    paddingBottom: 40,
  },

  title: {
    color: "white",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
  },

  subtitle: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginTop: 6,
  },

  email: {
    color: "white",
    opacity: 0.7,
    textAlign: "center",
    marginTop: 6,
  },

  bigLogo: {
    width: 180,
    height: 180,
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 20,
    resizeMode: "contain",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#0b1d44",
    paddingHorizontal: 18,
    marginBottom: 14,
  },

  cardText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
});