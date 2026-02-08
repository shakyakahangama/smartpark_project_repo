const BASE_URL = "http://172.20.10.4:5000"; // ✅ use your current backend IP

async function request(path, method, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  // ✅ safer JSON parse (prevents crash if response isn't JSON)
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || "Request failed";
    throw new Error(msg);
  }

  return data;
}

export const api = {
  // AUTH
  signup: (payload) => request("/signup", "POST", payload),
  login: (payload) => request("/login", "POST", payload),

  // VEHICLE
  addVehicle: (payload) => request("/vehicle/add", "POST", payload),
  listVehicles: (email) =>
    request(`/vehicle/list/${encodeURIComponent(email)}`, "GET"),

  // RESERVATION
  createReservation: (payload) =>
    request("/reservation/create", "POST", payload),
  listReservations: (email) =>
    request(`/reservation/list/${encodeURIComponent(email)}`, "GET"),
  cancelReservation: (payload) =>
    request("/reservation/cancel", "POST", payload),

  // ✅ PATH GUIDANCE (MODEL 2)
  guidance: (slotCode) =>
    request(`/guidance/${encodeURIComponent(slotCode)}`, "GET"),
};