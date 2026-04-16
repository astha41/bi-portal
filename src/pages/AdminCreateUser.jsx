// frontend/src/pages/AdminCreateUser.jsx
import React, { useEffect, useState } from "react";
import "./AdminCreateUser.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Small helper utilities ---------------------------------------------------
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function generateStrongPassword(length = 14) {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const special = "!@#$%^&*()-_=+[]{};:,.<>/?";
  const all = lower + upper + digits + special;
  let pw = "";
  pw += lower[randInt(0, lower.length - 1)];
  pw += upper[randInt(0, upper.length - 1)];
  pw += digits[randInt(0, digits.length - 1)];
  pw += special[randInt(0, special.length - 1)];
  for (let i = 4; i < length; i++) pw += all[randInt(0, all.length - 1)];
  return pw.split("").sort(() => 0.5 - Math.random()).join("");
}
function passwordScore(password = "") {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}
async function timeout(ms) { return new Promise(res => setTimeout(res, ms)); }

// fetch with timeout + one retry for transient network errors
async function retryFetch(url, opts = {}, retries = 1, timeoutMs = 7000) {
  const attempt = async () => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(id);
      return res;
    } finally {
      clearTimeout(id);
    }
  };

  try {
    return await attempt();
  } catch (err) {
    // network-level error (e.g. Failed to fetch / CORS / connection)
    if (retries > 0) {
      // small backoff
      await timeout(400);
      return retryFetch(url, opts, retries - 1, timeoutMs * 1.2);
    }
    throw err;
  }
}

// Component ---------------------------------------------------------------
export default function AdminCreateUser({ setUser, setRole }) {
  const [roles, setRoles] = useState(null);
  const [users, setUsers] = useState(null);

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [roleFallback, setRoleFallback] = useState("");

  const [loadingCreate, setLoadingCreate] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null); // single id for row actions
  const [roleEdits, setRoleEdits] = useState({});
  const [notice, setNotice] = useState(null); // { type: 'success'|'error'|'info', text }

  const token = localStorage.getItem("token");

  // show notice helper
  const showNotice = (type, text, ms = 5000) => {
    setNotice({ type, text });
    if (ms) setTimeout(() => setNotice(null), ms);
  };

  // Read server errors if JSON {detail/message} or plain text
  async function safeGetText(res) {
    try {
      const j = await res.json();
      return j.detail || j.message || JSON.stringify(j);
    } catch {
      try { return await res.text(); } catch { return null; }
    }
  }

  // Insert or update a single user in local users array (no reload)
  function upsertUserLocally(updatedUser) {
    setUsers(prev => {
      if (!prev) return [updatedUser];
      const idx = prev.findIndex(u => u.id === updatedUser.id);
      if (idx === -1) return [updatedUser, ...prev];
      const copy = prev.slice();
      copy[idx] = updatedUser;
      return copy;
    });
    setRoleEdits(prev => ({ ...prev, [updatedUser.id]: updatedUser.role?.name ?? "" }));
  }

  // Load initial data
  useEffect(() => {
    (async () => {
      await loadRoles();
      await loadUsers();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRoles() {
    setRoles(null);
    try {
      const res = await retryFetch(`${API}/roles`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }, 1);
      if (!res.ok) { setRoles([]); return; }
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) setSelectedRoleId(data[0].id);
    } catch (err) {
      setRoles([]);
      showNotice("error", "Failed to load roles (check backend/CORS).");
      console.error("loadRoles error:", err);
    }
  }

  async function loadUsers() {
    setUsers(null);
    try {
      const res = await retryFetch(`${API}/admin/users`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }, 1);
      if (!res.ok) {
        const txt = await safeGetText(res);
        showNotice("error", `Failed to load users: ${txt || res.status}`);
        setUsers([]);
        return;
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
      const edits = {};
      (Array.isArray(data) ? data : []).forEach(u => edits[u.id] = u.role?.name ?? "");
      setRoleEdits(edits);
    } catch (err) {
      setUsers([]);
      showNotice("error", "Failed to load users (check backend/CORS).");
      console.error("loadUsers error:", err);
    }
  }

  // Create user: on success insert user locally (no reload)
  const handleCreate = async (e) => {
    e.preventDefault();
    setNotice(null);
    if (!username.trim() || !email.trim() || !password) { showNotice("error","Complete username, email and password."); return; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email.trim())) { showNotice("error","Invalid email."); return; }
    if (passwordScore(password) < 4) { showNotice("error","Password too weak."); return; }
    if (!token) { showNotice("error","Not authenticated."); return; }

    setLoadingCreate(true);
    try {
      const payload = { username: username.trim(), email: email.trim(), password };
      if (roles && roles.length > 0 && selectedRoleId) payload.role_id = Number(selectedRoleId);
      else payload.role_name = roleFallback?.trim() || "employee";

      const res = await retryFetch(`${API}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }, 1);
      if (!res.ok) {
        const txt = await safeGetText(res);
        throw new Error(txt || `Create failed (${res.status})`);
      }
      const created = await res.json().catch(() => null);
      if (created && created.id) {
        upsertUserLocally(created);
        showNotice("success", `User created: ${created.username}`);
      } else {
        // fallback: if created but no user returned, request users once (initial load still minimal)
        await loadUsers();
        showNotice("success", "User created");
      }
      setUsername(""); setFullName(""); setEmail(""); setPassword("");
    } catch (err) {
      // If error looks like network/CORS provide a helpful hint
      const msg = String(err?.message || err);
      if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("networkerror") || msg.toLowerCase().includes("cors")) {
        showNotice("error", "Network/CORS error. Check backend running and CORS settings.");
      } else {
        showNotice("error", msg);
      }
      console.error("create error:", err);
    } finally {
      setLoadingCreate(false);
    }
  };

  // Optimistic activate/deactivate (no reload). Retries once on transient network error.
  async function toggleActiveOptimistic(user) {
    if (!token) { showNotice("error","Not authenticated"); return; }
    if (!user) return;

    const prevUser = { ...user };
    // Apply optimistic update immediately
    upsertUserLocally({ ...user, is_active: !user.is_active });

    setActionLoadingId(user.id);
    try {
      const endpoint = user.is_active ? `${API}/admin/users/${user.id}/deactivate` : `${API}/admin/users/${user.id}/activate`;
      const res = await retryFetch(endpoint, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }, 1);
      if (!res.ok) {
        const txt = await safeGetText(res);
        throw new Error(txt || `Action failed (${res.status})`);
      }
      const updated = await res.json().catch(() => null);
      if (updated && updated.id) upsertUserLocally(updated); // authoritative server update
      showNotice("success", prevUser.is_active ? "User deactivated" : "User activated");
    } catch (err) {
      // rollback immediate change
      upsertUserLocally(prevUser);
      const msg = String(err?.message || err);
      if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("cors")) {
        showNotice("error", "Network/CORS error while updating. Check backend/CORS and try again.");
      } else {
        showNotice("error", msg);
      }
      console.error("toggleActive error:", err);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function changeUserRoleOptimistic(userId) {
  if (!token) { showNotice("error","Not authenticated"); return; }

  const newRoleName = roleEdits[userId];
  if (!newRoleName) { showNotice("error","Select a role first"); return; }

  const prevUser = users?.find(u => u.id === userId);
  if (!prevUser) return;

  // optimistic update
  upsertUserLocally({ 
    ...prevUser, 
    role: { id: prevUser.role?.id ?? null, name: newRoleName } 
  });

  setActionLoadingId(userId);

  try {
    const res = await retryFetch(`${API}/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json", 
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ name: newRoleName }),
    }, 1);

    if (!res.ok) {
      const txt = await safeGetText(res);
      throw new Error(txt || `Role update failed (${res.status})`);
    }

    const updated = await res.json().catch(() => null);

    if (updated && updated.id) {
      upsertUserLocally(updated);

      // 🔥 IMPORTANT FIX: if current logged-in user changed role
      const currentUserId = JSON.parse(localStorage.getItem("current_user_id"));

      if (updated.id === currentUserId) {
        setUser(updated);
        setRole(updated.role?.name?.toLowerCase());
      }
    }

    showNotice("success", "Role updated");

  } catch (err) {
    upsertUserLocally(prevUser); // rollback

    const msg = String(err?.message || err);
    showNotice("error", msg);

    console.error("changeUserRole error:", err);
  } finally {
    setActionLoadingId(null);
  }
}

  // Password helpers
  const onGenerate = () => {
    setPassword(generateStrongPassword());
    showNotice("info", "Generated a strong password. Copy it now.");
  };
  const onCopyPassword = async () => {
    try { await navigator.clipboard.writeText(password); showNotice("success","Password copied"); }
    catch { showNotice("error","Copy failed"); }
  };

  // Render -----------------------------------------------------------------
  return (
    <div className="admin-provision-page refined">
      <div className="provision-card refined-card">
        <div className="card-top">
          <div className="title-block">
            <div className="logo-badge" aria-hidden>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="9" width="3" height="8" rx="0.8" fill="#7c3aed" />
                <rect x="9" y="5" width="3" height="12" rx="0.8" fill="#60a5fa" />
                <rect x="15" y="2" width="3" height="15" rx="0.8" fill="#10b981" />
              </svg>
            </div>
            <div>
              <h1>User Provisioning</h1>
              <p className="muted">Create users and manage roles</p>
            </div>
          </div>
          <div className="status-chip">Admin only</div>
        </div>

        {notice && <div className={`notice ${notice.type}`}>{notice.text}</div>}

        <form className="provision-form refined-form" onSubmit={handleCreate}>
          <div className="form-row">
            <div className="col">
              <label>Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" />
            </div>
            <div className="col">
              <label>Full name (optional)</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Smith" />
            </div>
          </div>

          <div className="form-row">
            <div className="col">
              <label>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="col">
              <label>Role</label>
              {roles === null ? (
                <div className="input loading">Loading roles…</div>
              ) : roles.length > 0 ? (
                <select value={selectedRoleId ?? ""} onChange={e => setSelectedRoleId(e.target.value)}>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              ) : (
                <input value={roleFallback} onChange={e => setRoleFallback(e.target.value)} placeholder="e.g. manager" />
              )}
            </div>
          </div>

          <div className="form-row align-end">
            <div className="col">
              <label>Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter or generate strong password" />
              <div className="strength-row">
                <div className="strength-bar"><div className="strength-fill" style={{ width: `${Math.min(100, (passwordScore(password)/5)*100)}%` }} /></div>
                <div className="strength-text">{["Very weak","Weak","Fair","Good","Strong"][Math.max(0, passwordScore(password)-1)] || "Very weak"}</div>
              </div>
            </div>
            <div className="col actions-col">
              <button type="button" className="btn primary" onClick={onGenerate}>⚡ Generate</button>
              <button type="button" className="btn" onClick={onCopyPassword}>📋 Copy</button>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn cta" disabled={loadingCreate}>{loadingCreate ? "Creating…" : "Create user"}</button>
            <button type="button" className="btn ghost" onClick={() => { setUsername(""); setFullName(""); setEmail(""); setPassword(""); }}>✖ Reset</button>
          </div>
        </form>

        <h2 className="table-title">Provisioned users</h2>

        <div className="users-wrap">
          {users === null ? (
            <div className="loading-rows">Loading users…</div>
          ) : users.length === 0 ? (
            <div className="empty">No users provisioned yet.</div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>
                      <div className="role-edit">
                        <select
                          value={roleEdits[u.id] ?? (u.role?.name ?? "")}
                          onChange={e => setRoleEdits(prev => ({ ...prev, [u.id]: e.target.value }))}
                          disabled={actionLoadingId === u.id}
                        >
                          {(roles || []).map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                        </select>
                        <button
                          className="btn small"
                          onClick={() => changeUserRoleOptimistic(u.id)}
                          disabled={actionLoadingId === u.id}
                        >
                          {actionLoadingId === u.id ? "Updating…" : "Update"}
                        </button>
                      </div>
                    </td>
                    <td>{u.is_active ? <span className="active-yes">Yes</span> : <span className="active-no">No</span>}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn small"
                          onClick={() => toggleActiveOptimistic(u)}
                          disabled={actionLoadingId === u.id}
                        >
                          {actionLoadingId === u.id ? "…" : (u.is_active ? "Deactivate" : "Activate")}
                        </button>
                        <button className="btn small" onClick={() => navigator.clipboard?.writeText(u.email).then(()=>showNotice("success","Email copied")).catch(()=>showNotice("error","Copy failed"))}>
                          Copy email
                        </button>
                        <div className="user-id">id:{u.id}</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}