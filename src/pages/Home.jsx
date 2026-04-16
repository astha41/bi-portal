// src/pages/Home.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Home.css";

import employeeIcon from "./employee.png";
import projectIcon from "./project.png";
import performanceIcon from "./performance.png";
import hiringIcon from "./hiring.png";

const dashboards = [
  { id: "employee-dash", path: "/employee", title: "Employee Analytics", desc: "Department, salary and workforce insights", icon: employeeIcon, favImage: "/employee.jpg", allowedRoles: ["admin", "hr"] },
  { id: "project-dash", path: "/project", title: "Project Analytics", desc: "Project budgets, teams and delivery metrics", icon: projectIcon, favImage: "/project.jpg", allowedRoles: ["admin", "manager", "finance manager"] },
  { id: "performance-dash", path: "/performance", title: "Performance Analytics", desc: "Employee performance and productivity analysis", icon: performanceIcon, favImage: "/performance.jpg", allowedRoles: ["admin", "analyst"] },
  { id: "hiring-dash", path: "/hiring", title: "Hiring Analytics", desc: "Recruitment funnel and hiring success metrics", icon: hiringIcon, favImage: "/hiring.jpg", allowedRoles: ["admin", "manager", "hr"] },
];

function userKeyFor(user) {
  return (user && (user.username || user.id)) ? String(user.username || user.id) : "anonymous";
}
function storageKeyForUser(userKey) {
  return `biportal:favorites:${userKey}`;
}
function readAllFavs(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function writeAllFavs(key, obj) {
  try {
    localStorage.setItem(key, JSON.stringify(obj || {}));
    return true;
  } catch {
    return false;
  }
}
function normalizeRole(name) {
  return (name || "").toString().toLowerCase();
}
function allowedForRole(dashboardId, role) {
  const d = dashboards.find((x) => x.id === dashboardId);
  if (!d || !d.allowedRoles) return false;
  return d.allowedRoles.map((r) => (r || "").toLowerCase()).includes(normalizeRole(role));
}

export default function Home({ user, role }) {
  const location = useLocation();
  const userKey = userKeyFor(user);
  const storageKey = storageKeyForUser(userKey);
  const currentRole = normalizeRole(role);
  const [favorites, setFavorites] = useState({}); // role-scoped view: { [dashId]: true }

  // Load role-scoped favorites (only those allowed for current role)
  const loadRoleFavorites = useCallback(() => {
    const all = readAllFavs(storageKey);
    const roleKey = currentRole || "anon";
    const roleMap = (all && all[roleKey]) ? all[roleKey] : {};
    // filter by allowedForRole (in case stored favorites include dashboards no longer allowed)
    const cleaned = {};
    Object.keys(roleMap || {}).forEach((dashId) => {
      if (allowedForRole(dashId, currentRole)) cleaned[dashId] = true;
    });
    setFavorites(cleaned);
    return cleaned;
  }, [storageKey, currentRole]);

  useEffect(() => {
    // initial load
    loadRoleFavorites();
  }, [loadRoleFavorites]);

  // Listen for role-scoped favorites-updated events and storage events
  useEffect(() => {
    const onCustom = (e) => {
      const detail = e?.detail || {};
      // detail: { userKey, role, dashboardId, isFavorite }
      if (!detail || detail.userKey !== userKey) return;
      // react only if the event role matches currentRole (we display currentRole's favorites)
      const eventRole = normalizeRole(detail.role || "");
      if (eventRole !== (currentRole || "anon")) return;
      setFavorites((prev) => {
        const next = { ...(prev || {}) };
        if (detail.isFavorite) next[detail.dashboardId] = true;
        else delete next[detail.dashboardId];
        return next;
      });
    };

    const onStorage = (e) => {
      if (e.key !== storageKey) return;
      // storage changed for this user; re-load role favorites
      loadRoleFavorites();
    };

    window.addEventListener("favorites-updated", onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("favorites-updated", onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [userKey, storageKey, currentRole, loadRoleFavorites]);

  // Re-load when navigating back to Home (ensures admin role change shows the right favourites)
  useEffect(() => {
    loadRoleFavorites();
  }, [location.pathname, loadRoleFavorites]);

  // Toggle favorites only for the current user's active role
  const toggleFavorite = async (dashboardId, allowedRoles, e) => {
    if (e && e.preventDefault) { e.preventDefault(); e.stopPropagation(); }
    if (!allowedForRole(dashboardId, currentRole)) return;

    const all = readAllFavs(storageKey);
    const roleKey = currentRole || "anon";
    const roleMap = all[roleKey] ? { ...all[roleKey] } : {};

    const prev = !!roleMap[dashboardId];
    if (prev) delete roleMap[dashboardId];
    else roleMap[dashboardId] = true;

    const nextAll = { ...(all || {}), [roleKey]: roleMap };
    writeAllFavs(storageKey, nextAll);

    // update local view and notify other tabs/components (include role in event)
    setFavorites(roleMap);
    window.dispatchEvent(new CustomEvent("favorites-updated", { detail: { userKey, role: roleKey, dashboardId, isFavorite: !prev } }));

    // best-effort persist to backend if available (unchanged)
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:8000"}/superset/favorites/${dashboardId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("Persist favorites failed", err);
      }
    }
  };

  const favCount = Object.keys(favorites || {}).length;

  return (
    <div className="page-container">
      <div className="welcome-card">
        <div className="welcome-text">
          <p className="welcome-label">⚡ Dashboard Overview</p>
          <h2 className="welcome-title">Welcome, <span className="role-highlight">{currentRole || "User"}</span></h2>
          <p className="welcome-desc">Explore your analytics dashboards and gain insights from your data.</p>
        </div>
        <div className="welcome-blob"></div>
      </div>

      <h2 style={{ transform: "translateY(20px)", fontSize: "1.7rem" }}>Dashboards</h2>
      <div className="card-grid">
        {dashboards.map((d) => {
          const fav = !!favorites[d.id];
          const allowed = allowedForRole(d.id, currentRole);
          return (
            <Link key={d.id} to={d.path} className="dashboard-card" aria-label={d.title}>
              <button
                className={`fav-icon ${fav ? "fav-on" : ""} ${!allowed ? "fav-disabled" : ""}`}
                onClick={(e) => toggleFavorite(d.id, d.allowedRoles, e)}
                title={allowed ? (fav ? "Remove favorite" : "Add favorite") : "You don't have permission to favourite this dashboard"}
                aria-pressed={fav}
                aria-disabled={!allowed}
                type="button"
              >
                {fav ? "★" : "☆"}
              </button>

              <h3>{d.title}</h3>
              <img src={d.icon} alt={d.title} className="card-icon" />
              <p>{d.desc}</p>
              <span>Click to explore →</span>
            </Link>
          );
        })}
      </div>

      <div className="fav-section">
        <div className="fav-header">
          <h2>Favorites</h2>
          <div className="fav-count">{favCount} dashboards</div>
        </div>

        <div className="fav-grid">
          {favCount === 0 ? (
            <div className="fav-empty">
              <div className="fav-empty-icon">⭐</div>
              <p>No favorites yet</p>
            </div>
          ) : (
            dashboards.filter((d) => favorites[d.id]).map((d) => (
              <Link key={d.id} to={d.path} className="fav-card">
                <div className="fav-image"><img src={d.favImage} alt={d.title} /></div>
                <div className="fav-content">
                  <div className="fav-top">
                    <h3>{d.title}</h3>
                    <button
                      type="button"
                      className={`fav-star ${!allowedForRole(d.id, currentRole) ? "fav-disabled" : ""}`}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(d.id, d.allowedRoles, e); }}
                    >★</button>
                  </div>
                  <p>{d.desc}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}