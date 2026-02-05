import React from "react";
import { Text, StyleSheet, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function Home() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  return (
    <LinearGradient
      colors={["#071a3a", "#243b63", "#b9b9b9"]}
      style={styles.bg}
    >
      {/* LOGO */}
      <Image
        source={require("../../assets/images/logo.png")}
        style={styles.logo}
      />

      {/* TITLE */}
      <Text style={styles.title}>SMARTPARK</Text>
      <Text style={styles.subtitle}>Welcome back 🎉</Text>

      {/* ILLUSTRATION */}
      <Image
        source={require("../../assets/images/home-illustration.png")}
        style={styles.illustration}
      />

      {/* MENU BUTTONS */}
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
        icon="navigate"
        text="Path Guidance"
        onPress={() => router.push("/path-guidance")}
      />

      <MenuCard
        icon="chatbox-ellipses"
        text="Feedback"
        onPress={() => router.push("/feedback")}
      />
    </LinearGradient>
  );
}

/* REUSABLE MENU CARD */
function MenuCard({ icon, text, onPress }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Ionicons name={icon} size={26} color="#fff" />
      <Text style={styles.cardText}>{text}</Text>
    </Pressable>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  bg: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 60,
  },

  logo: {
    width: 10,
    height: 10,
    alignSelf: "center",
    marginBottom: 10,
  },

  title: {
    color: "white",
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },

  subtitle: {
    color: "white",
    marginTop: 8,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    opacity: 0.9,
  },

  illustration: {
    width: "100%",
    height: 180,
    resizeMode: "contain",
    marginBottom: 24,
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
    elevation: 4,
  },

  cardText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
