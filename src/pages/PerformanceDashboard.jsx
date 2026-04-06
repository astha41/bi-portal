import React, { useEffect, useRef, useState, useCallback } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";

/**
 * PerformanceDashboard
 * - Props: user, role
 * - DASH_ID: "performance-dash"
 */
function PerformanceDashboard({ user, role }) {
  const dashboardRef = useRef(null);

  const DASH_ID = "performance-dash";
  const EMBED_ID = "9ea5c64e-3ba4-4638-9b26-a36847de3de4";
  const allowedRoles = ["admin", "analyst"];

  const userKey = user?.username || user?.id || "anonymous";
  const storageKey = `biportal:favorites:${userKey}`;

  const [isFav, setIsFav] = useState(false);

  const readFavorites = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, [storageKey]);

  const writeFavorite = useCallback(
    (dashboardId, value) => {
      try {
        const prev = readFavorites();
        const next = { ...prev, [dashboardId]: !!value };
        localStorage.setItem(storageKey, JSON.stringify(next));
        window.dispatchEvent(
          new CustomEvent("favorites-updated", {
            detail: { userKey, dashboardId, isFavorite: !!value },
          })
        );
        return true;
      } catch {
        return false;
      }
    },
    [storageKey, userKey, readFavorites]
  );

  useEffect(() => {
    const parsed = readFavorites();
    setIsFav(!!parsed[DASH_ID]);

    const onFavoritesUpdated = (e) => {
      const detail = e.detail || {};
      if (detail.userKey === userKey) {
        const p = readFavorites();
        setIsFav(!!p[DASH_ID]);
      }
    };

    const onStorage = (e) => {
      const expectedKey = storageKey;
      if (e.key === expectedKey) {
        const p = readFavorites();
        setIsFav(!!p[DASH_ID]);
      }
    };

    window.addEventListener("favorites-updated", onFavoritesUpdated);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("favorites-updated", onFavoritesUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [readFavorites, storageKey, userKey]);

  useEffect(() => {
    if (!dashboardRef.current) return;
    dashboardRef.current.innerHTML = "";

    embedDashboard({
      id: EMBED_ID,
      supersetDomain: "http://localhost:8088",
      mountPoint: dashboardRef.current,
      fetchGuestToken: () =>
        fetch(`http://localhost:8000/superset/token/${EMBED_ID}`)
          .then((res) => res.json())
          .then((data) => data.token),
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentRole = (role || "").toString().toLowerCase();
  const isAllowed = () => allowedRoles.map((r) => r.toLowerCase()).includes(currentRole);

  const toggleFav = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!isAllowed()) {
      alert("You don't have permission to favourite this dashboard.");
      return;
    }
    const next = !isFav;
    writeFavorite(DASH_ID, next);
    setIsFav(next);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Performance Dashboard</h2>

        <div
          onClick={toggleFav}
          style={styles.favoriteBox}
          role="button"
          aria-pressed={isFav}
          aria-label={isFav ? "Unfavorite" : "Favorite"}
        >
          <span style={{ ...styles.star, color: isFav ? "#FFD700" : "#999" }}>
            {isFav ? "★" : "☆"}
          </span>
          <span style={styles.text}>{isFav ? "Favorited" : "Add to Favorites"}</span>
        </div>
      </div>

      <div style={styles.card}>
        <div ref={dashboardRef} style={styles.dashboard} />
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "20px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { margin: 0 },
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
  star: { fontSize: "18px" },
  text: { fontSize: "14px", fontWeight: "500" },
  card: {
    marginTop: "10px",
    borderRadius: "16px",
    padding: "10px",
    background: "rgba(255,255,255,0.6)",
  },
  dashboard: { height: "1000px" },
};

export default PerformanceDashboard;;