const PC_IP = "10.30.1.78"; // <-- your backend IP
const BASE_URL = `http://${PC_IP}:5000`;

async function request(path, method, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export const api = {
  signup: (payload) => request("/signup", "POST", payload),
  login: (payload) => request("/login", "POST", payload),
  addVehicle: (payload) => request("/vehicle/add", "POST", payload),
  createReservation: (payload) =>
    request("/reservation/create", "POST", payload),

};
