// src/api/store/session.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "SMARTPARK_SESSION_V1";
const RES_KEY = "SMARTPARK_LAST_RES_V1";

let _user = null;
let _vehicles = [];

export const session = {
  async hydrate() {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      _user = parsed.user || null;
      _vehicles = parsed.vehicles || [];
    }
  },

  getUser() {
    return _user;
  },

  getVehicles() {
    return _vehicles || [];
  },

  async setAuth(user, vehicles) {
    _user = user;
    _vehicles = vehicles || [];
    await AsyncStorage.setItem(KEY, JSON.stringify({ user: _user, vehicles: _vehicles }));
  },

  async clear() {
    _user = null;
    _vehicles = [];
    await AsyncStorage.removeItem(KEY);
    await AsyncStorage.removeItem(RES_KEY);
  },

  async setLastReservation(payload) {
    await AsyncStorage.setItem(RES_KEY, JSON.stringify(payload));
  },

  async getLastReservation() {
    const raw = await AsyncStorage.getItem(RES_KEY);
    return raw ? JSON.parse(raw) : null;
  },
};