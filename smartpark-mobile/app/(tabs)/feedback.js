// app/(tabs)/feedback.js
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import GradientScreen from "../../components/GradientScreen";
import TopBar from "../../components/TopBar";
import TextField from "../../components/TextField";
import PrimaryButton from "../../components/PrimaryButton";
import { api } from "../../src/api/client";
import { session } from "../../src/api/store/session";

export default function Feedback() {
  const [msg, setMsg] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;
    if (!msg) return Alert.alert("Error", "Please enter feedback.");
    if (!rating) return Alert.alert("Error", "Please give a rating.");

    const user = session.getUser();
    if (!user?.email) return Alert.alert("Error", "User not logged in.");

    try {
      setLoading(true);
      await api.submitFeedback({
        email: user.email,
        message: msg,
        rating: rating,
      });

      Alert.alert("Thank you", "Feedback submitted.");
      setMsg("");
      setRating(0);
      router.back();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <GradientScreen>
      <TopBar title="" onBack={() => router.back()} />
      <Text style={styles.title}>FEEDBACK</Text>

      <Text style={styles.lbl}>SHARE YOUR FEEDBACK:</Text>
      <TextField value={msg} onChangeText={setMsg} placeholder="" />

      <Text style={styles.lbl}>RATE YOUR EXPERIENCE:</Text>
      <View style={styles.stars}>
        {Array.from({ length: 5 }).map((_, i) => {
          const star = i + 1;
          const on = rating >= star;
          return (
            <Pressable key={star} onPress={() => setRating(star)} style={styles.starBtn}>
              <Text style={[styles.star, on && styles.starOn]}>{on ? "★" : "☆"}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.row}>
        <PrimaryButton title="CANCEL" onPress={() => router.back()} style={{ flex: 1, marginRight: 10 }} />
        <PrimaryButton title={loading ? "..." : "SUBMIT"} onPress={submit} disabled={loading} style={{ flex: 1, marginLeft: 10 }} />
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  title: { color: "white", fontSize: 26, letterSpacing: 2, textAlign: "center", marginVertical: 12, fontWeight: "600" },
  lbl: { color: "#ddd", marginTop: 16, fontSize: 11, letterSpacing: 1 },
  stars: { flexDirection: "row", backgroundColor: "white", borderRadius: 18, height: 44, alignItems: "center", justifyContent: "space-evenly", marginTop: 10 },
  starBtn: { paddingHorizontal: 6 },
  star: { fontSize: 22, color: "#bbb" },
  starOn: { color: "#061a44" },
  row: { flexDirection: "row", marginTop: 30 },
});