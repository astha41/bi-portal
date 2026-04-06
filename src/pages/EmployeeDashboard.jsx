import React, { useEffect, useRef, useState, useCallback } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";

function EmployeeDashboard({ user, role }) {
  const dashboardRef = useRef(null);
  const DASH_ID = "employee-dash"; // must match Home.jsx id
  const allowedRoles = ["admin"];

  // per-user storage key
  const userKey = user?.username || user?.id || "anonymous";
  const storageKey = `biportal:favorites:${userKey}`;

  const [isFavorite, setIsFavorite] = useState(false);

  // --- helpers wrapped with useCallback so they are stable and can be safely used in effects ---
  const readFavorites = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, [storageKey]);

  const writeFavorite = useCallback((dashboardId, value) => {
    try {
      const prev = readFavorites();
      const next = { ...prev, [dashboardId]: !!value };
      localStorage.setItem(storageKey, JSON.stringify(next));
      // Broadcast to same-window listeners
      window.dispatchEvent(new CustomEvent("favorites-updated", { detail: { userKey, dashboardId, isFavorite: !!value } }));
      return true;
    } catch {
      return false;
    }
  }, [storageKey, userKey, readFavorites]);

  // load favorite on mount and listen for updates (uses readFavorites in deps)
  useEffect(() => {
    const parsed = readFavorites();
    setIsFavorite(!!parsed[DASH_ID]);

    const onFavoritesUpdated = (e) => {
      const detail = e.detail || {};
      // Only react to updates for the same userKey
      if (detail.userKey === userKey) {
        const p = readFavorites();
        setIsFavorite(!!p[DASH_ID]);
      }
    };

    const onStorage = (e) => {
      // cross-tab: storage event fires in other tabs when localStorage changes
      const expectedKey = storageKey;
      if (e.key === expectedKey) {
        const p = readFavorites();
        setIsFavorite(!!p[DASH_ID]);
      }
    };

    window.addEventListener("favorites-updated", onFavoritesUpdated);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("favorites-updated", onFavoritesUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [readFavorites, storageKey, userKey]); // readFavorites is stable via useCallback

  // load superset dashboard (only needs to run once, dashboardRef stable)
  useEffect(() => {
    if (!dashboardRef.current) return;
    dashboardRef.current.innerHTML = "";

    embedDashboard({
      id: "eb8fde9f-64ad-4ac0-9ee9-496f8d244cbf",
      supersetDomain: "http://localhost:8088",
      mountPoint: dashboardRef.current,
      fetchGuestToken: () =>
        fetch(`http://localhost:8000/superset/token/eb8fde9f-64ad-4ac0-9ee9-496f8d244cbf`)
          .then((res) => res.json())
          .then((data) => data.token),
    });
  }, []); // intentionally empty - dashboard embed runs once

  const currentRole = (role || "").toString().toLowerCase();
  const isAllowed = () => allowedRoles.map((r) => r.toLowerCase()).includes(currentRole);

  const toggleFavorite = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!isAllowed()) {
      alert("You don't have permission to favourite this dashboard.");
      return;
    }
    const next = !isFavorite;
    // persist and broadcast via writeFavorite
    writeFavorite(DASH_ID, next);
    setIsFavorite(next);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Employee Analysis</h2>

        <div
          onClick={toggleFavorite}
          style={styles.favoriteBox}
          role="button"
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "Unfavorite" : "Favorite"}
        >
          <span style={{ ...styles.star, color: isFavorite ? "#FFD700" : "#999" }}>
            {isFavorite ? "★" : "☆"}
          </span>

          <span style={styles.text}>
            {isFavorite ? "Favorited" : "Add to Favorites"}
          </span>
        </div>
      </div>

      <div style={styles.card}>
        <div ref={dashboardRef} style={styles.dashboard} />
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "20px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    margin: 0,
  },

  favoriteBox: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.6)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },

  star: {
    fontSize: "18px",
  },

  text: {
    fontSize: "14px",
    fontWeight: "500",
  },

  card: {
    marginTop: "10px",
    borderRadius: "16px",
    padding: "10px",
    background: "rgba(255,255,255,0.6)",
  },

  dashboard: {
    height: "1000px",
  },
};

export default EmployeeDashboard;