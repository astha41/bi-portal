// src/pages/EmployeeDashboard.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";

const EMBED_ID = "eb8fde9f-64ad-4ac0-9ee9-496f8d244cbf";
const DASH_ID = "employee-dash";
const ALLOWED_ROLES = ["admin", "hr"];
const SUP_BASE = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/superset` : "http://localhost:8000/superset";

function normalizeRole(name) {
  return (name || "").toString().toLowerCase();
}
function userKeyFor(user) {
  return (user && (user.username || user.id)) ? String(user.username || user.id) : "anonymous";
}

/* Storage helpers (role-scoped) */
function readAllFavs(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function writeAllFavs(storageKey, obj) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(obj || {}));
    return true;
  } catch {
    return false;
  }
}
function isLegacyFlat(obj) {
  if (!obj || typeof obj !== "object") return false;
  return Object.keys(obj).some((k) => typeof obj[k] === "boolean");
}

export default function EmployeeDashboard({ user, role }) {
  const headerRef = useRef(null);
  const mountRef = useRef(null);

  const userKey = userKeyFor(user);
  const storageKey = `biportal:favorites:${userKey}`;
  const roleKey = normalizeRole(role) || "anon";

  const [isFav, setIsFav] = useState(false);
  const [saving, setSaving] = useState(false);

  const readRoleFavs = useCallback(() => {
    const all = readAllFavs(storageKey);
    if (isLegacyFlat(all) && !all[roleKey]) {
      // migrate legacy flat -> role bucket
      const next = { ...(all || {}) };
      next[roleKey] = { ...(next[roleKey] || {}), ...all };
      writeAllFavs(storageKey, next);
      return next[roleKey] || {};
    }
    return (all && all[roleKey]) ? all[roleKey] : {};
  }, [storageKey, roleKey]);

  const writeRoleFav = useCallback((dashboardId, value) => {
    const all = readAllFavs(storageKey);
    const nextAll = { ...(all || {}) };
    nextAll[roleKey] = { ...(nextAll[roleKey] || {}) };
    if (value) nextAll[roleKey][dashboardId] = true;
    else delete nextAll[roleKey][dashboardId];
    writeAllFavs(storageKey, nextAll);

    // dispatch role-aware event
    window.dispatchEvent(new CustomEvent("favorites-updated", {
      detail: { userKey, role: roleKey, dashboardId, isFavorite: !!value }
    }));
    return true;
  }, [storageKey, roleKey, userKey]);

  // init favorite state & listeners
  useEffect(() => {
    const p = readRoleFavs();
    setIsFav(!!p[DASH_ID]);

    const onFavoritesUpdated = (e) => {
      const detail = e?.detail || {};
      if (detail.userKey !== userKey) return;
      if (normalizeRole(detail.role || "") !== roleKey) return;
      const updated = readRoleFavs();
      setIsFav(!!updated[DASH_ID]);
    };

    const onStorage = (e) => {
      if (e.key !== storageKey) return;
      const updated = readRoleFavs();
      setIsFav(!!updated[DASH_ID]);
    };

    window.addEventListener("favorites-updated", onFavoritesUpdated);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("favorites-updated", onFavoritesUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [readRoleFavs, storageKey, userKey, roleKey]);

  // ensure mount height large and embed dashboard
  const updateMountHeight = useCallback(() => {
    try {
      const headerRect = headerRef.current?.getBoundingClientRect();
      if (!mountRef.current) return;
      const gap = 24;
      const headerBottom = headerRect ? headerRect.bottom : 0;
      const h = Math.max(480, window.innerHeight - headerBottom - gap);
      mountRef.current.style.height = `${h}px`;
      Array.from(mountRef.current.children).forEach((c) => {
        if (c instanceof HTMLElement) { c.style.width = "100%"; c.style.height = "100%"; }
      });
    } catch {}
  }, []);

  useEffect(() => {
    updateMountHeight();
    const onResize = () => updateMountHeight();
    window.addEventListener("resize", onResize);

    if (mountRef.current) mountRef.current.innerHTML = "";

    embedDashboard({
      id: EMBED_ID,
      supersetDomain: "http://localhost:8088",
      mountPoint: mountRef.current,
      fetchGuestToken: () =>
        fetch(`http://localhost:8000/superset/token/${EMBED_ID}`)
          .then((res) => res.json())
          .then((data) => data.token),
    });

    const observer = new MutationObserver(() => {
      if (!mountRef.current) return;
      const iframes = mountRef.current.getElementsByTagName("iframe");
      for (const iframe of iframes) {
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";
      }
      Array.from(mountRef.current.children).forEach((c) => {
        if (c instanceof HTMLElement) { c.style.width = "100%"; c.style.height = "100%"; }
      });
    });
    if (mountRef.current) observer.observe(mountRef.current, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("resize", onResize);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mountRef, EMBED_ID, updateMountHeight]);

  const toggleFav = async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const currentRole = normalizeRole(role);
    const allowed = ALLOWED_ROLES.map((r) => r.toLowerCase()).includes(currentRole);
    if (!allowed) {
      alert("You don't have permission to favourite this dashboard.");
      return;
    }
    if (saving) return;

    const next = !isFav;
    writeRoleFav(DASH_ID, next);
    setIsFav(next);

    const token = localStorage.getItem("token");
    if (!token) return;
    setSaving(true);
    try {
      await fetch(`${SUP_BASE}/favorites/${DASH_ID}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ role: roleKey, isFavorite: next }),
      });
    } catch (err) {
      console.error("Persist favorite failed", err);
    } finally {
      setSaving(false);
    }
  };

  // inline styles
  const styles = {
    page: { padding: 20, display: "flex", flexDirection: "column", minHeight: "calc(100vh - 64px)", boxSizing: "border-box", gap: 12 },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
    title: { margin: 0, fontSize: 28, fontWeight: 700, color: "#0f172a" },
    favPill: { display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 999, background: "linear-gradient(90deg,#fff,#fafafa)", border: "1px solid rgba(15,23,42,0.06)", cursor: saving ? "wait" : "pointer", fontWeight: 700, boxShadow: "0 8px 24px rgba(2,6,23,0.06)" },
    favStar: { fontSize: 18, color: isFav ? "#f6c54a" : "#9aa4b2" },
    card: { background: "#ffffff", borderRadius: 10, boxShadow: "0 8px 30px rgba(2,6,23,0.04)", padding: 14, display: "flex", flexDirection: "column", gap: 12 },
    mount: { width: "100%", height: "100%", minHeight: 520, boxSizing: "border-box" }
  };

  return (
    <div style={styles.page}>
      <div ref={headerRef} style={styles.header}>
        <h1 style={styles.title}>Employee Analysis</h1>

        <button onClick={toggleFav} aria-pressed={isFav} aria-busy={saving} title={isFav ? "Favorited" : "Add to favorites"} style={styles.favPill}>
          <span style={styles.favStar} aria-hidden>{isFav ? "★" : "☆"}</span>
          <span>{isFav ? "Favorited" : "Add to Favorites"}</span>
        </button>
      </div>

      <div style={styles.card}>
        <div ref={mountRef} style={styles.mount} />
      </div>
    </div>
  );
}