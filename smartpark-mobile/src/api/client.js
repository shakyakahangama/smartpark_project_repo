// src/api/client.js

export const API_BASE_URL = "http://172.20.10.4:5000"; // ✅ Connected via mobile hotspot

async function request(path, { method = "GET", body, headers } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      const msg =
        data?.error ||
        data?.message ||
        `Request failed (${res.status})`;
      throw new Error(msg);
    }

    return data;
  } catch (err) {
    if (String(err?.name) === "AbortError") {
      throw new Error(
        "Request timeout. Check phone + backend are on same network and Flask is running."
      );
    }

    throw new Error(
      `Network/API error: ${err?.message || err}. URL: ${API_BASE_URL}${path}`
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {

  // ==============================
  // AUTH
  // ==============================

  signup: (payload) =>
    request("/signup", { method: "POST", body: payload }),

  login: (payload) =>
    request("/login", { method: "POST", body: payload }),

  // ==============================
  // VEHICLES
  // ==============================

  saveVehicleDetails: (payload) =>
    request("/vehicle/details", { method: "POST", body: payload }),

  listVehicles: (email) =>
    request(`/vehicle/list/${encodeURIComponent(email)}`),

  // ==============================
  // RESERVATION
  // ==============================

  createReservation: (payload) =>
    request("/reservation/create", { method: "POST", body: payload }),

  listReservations: (email) =>
    request(`/reservation/list/${encodeURIComponent(email)}`),

  cancelReservation: (reservationId) =>
    request("/reservation/cancel", {
      method: "POST",
      body: { reservation_id: reservationId },
    }),

  // ==============================
  // SLOT STATUS (LIVE LAYOUT)
  // ==============================

  getSlotStatus: () =>
    request("/slots/status"),

  // ==============================
  // VISION SYSTEM (OPTIONAL TEST)
  // ==============================

  updateSlotStatus: (payload) =>
    request("/update-slot", {
      method: "POST",
      body: payload,
    }),

  // ==============================
  // DEV / TEST ROUTES
  // ==============================

  initSlots: () =>
    request("/init-slots"),

  resetSlots: () =>
    request("/reset-slots"),

  freeReservedSlots: () =>
    request("/free-slots"),

  // ==============================
  // PATH GUIDANCE
  // ==============================

  guidance: (slotCode) =>
    request(`/guidance/${encodeURIComponent(slotCode)}`),

  // Live webcam snapshot URL (for Image source — NOT a fetch call)
  videoSnapshotUrl: (slotCode) =>
    `${API_BASE_URL}/video-snapshot?slot=${encodeURIComponent(slotCode)}`,

  // MJPEG stream URL (for browser testing)
  videoFeedUrl: (slotCode) =>
    `${API_BASE_URL}/video-feed?slot=${encodeURIComponent(slotCode)}`,

  // ==============================
  // NOTIFICATIONS
  // ==============================

  notifications: (email) =>
    request(`/notifications/${encodeURIComponent(email)}`),

  // ==============================
  // FEEDBACK
  // ==============================

  submitFeedback: (payload) =>
    request("/feedback", { method: "POST", body: payload }),
};