const API_BASE = "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);

  const text = await res.text();
  let body;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const err = new Error(body?.detail || body || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return body;
}

export async function login(username, password) {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const res = await fetch("http://127.0.0.1:8000/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData
  });

  if (!res.ok) {
    throw new Error("Login failed");
  }

  const data = await res.json();

  localStorage.setItem("token", data.access_token);

  return data;
}

export async function getCurrentUser() {
  const token = localStorage.getItem("token");

  if (!token) throw new Error("No token");

  return request("/users/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function logout() {
  localStorage.removeItem("token");
}