// src/store/session.js
let user = null;

export const session = {
  setUser: (u) => (user = u),
  getUser: () => user,
  clear: () => (user = null),
};