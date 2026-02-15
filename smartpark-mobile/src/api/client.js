export const BASE_URL = "http://172.20.10.4:5000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }

  return data;
}

export const api = {
  signup: (payload) =>
    request("/signup", { method: "POST", body: JSON.stringify(payload) }),

  login: (payload) =>
    request("/login", { method: "POST", body: JSON.stringify(payload) }),
};