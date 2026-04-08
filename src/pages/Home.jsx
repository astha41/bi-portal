// src/pages/Home.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

import employeeIcon from "./employee.png";
import projectIcon from "./project.png";
import performanceIcon from "./performance.png";
import hiringIcon from "./hiring.png";

/* DASHBOARDS CONFIG (ids must match dashboard pages) */
const dashboards = [
  { id: "employee-dash", path: "/employee", title: "Employee Analytics", desc: "Department, salary and workforce insights", icon: employeeIcon, favImage: "/employee.jpg", allowedRoles: ["admin", "hr"] },
  { id: "project-dash", path: "/project", title: "Project Analytics", desc: "Project budgets, teams and delivery metrics", icon: projectIcon, favImage: "/project.jpg", allowedRoles: ["admin", "manager" , "Finance"] },
  { id: "performance-dash", path: "/performance", title: "Performance Analytics", desc: "Employee performance and productivity analysis", icon: performanceIcon, favImage: "/performance.jpg", allowedRoles: ["admin", "analyst"] },
  { id: "hiring-dash", path: "/hiring", title: "Hiring Analytics", desc: "Recruitment funnel and hiring success metrics", icon: hiringIcon, favImage: "/hiring.jpg", allowedRoles: ["admin", "manager","hr"] },
];

/* --- helpers to read/write per-user favorites and broadcast updates --- */
const storageKeyFor = (userKey) => `biportal:favorites:${userKey}`;

function readFavorites(userKey) {
  try {
    const raw = localStorage.getItem(storageKeyFor(userKey));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeFavorite(userKey, dashboardId, isFav) {
  try {
    const key = storageKeyFor(userKey);
    const prevRaw = localStorage.getItem(key);
    const prev = prevRaw ? JSON.parse(prevRaw) : {};
    const next = { ...prev, [dashboardId]: !!isFav };
    localStorage.setItem(key, JSON.stringify(next));
    // Broadcast to other listeners in same window
    const evDetail = { userKey, dashboardId, isFavorite: !!isFav };
    window.dispatchEvent(new CustomEvent("favorites-updated", { detail: evDetail }));
    // Note: other tabs/windows also get 'storage' event because localStorage was set
    return true;
  } catch {
    return false;
  }
}

export default function Home({ role, user }) {
  const userKey = user?.username || user?.id || "anonymous";
  const [favorites, setFavorites] = useState(() => readFavorites(userKey));

  // load on userKey change
  useEffect(() => {
    setFavorites(readFavorites(userKey));
  }, [userKey]);

  // update local state when other parts of app update favorites
  useEffect(() => {
    const onFavoritesUpdated = (e) => {
      const { userKey: changedUserKey } = e.detail || {};
      // if same user, reload favorites
      if (changedUserKey === userKey) {
        setFavorites(readFavorites(userKey));
      }
    };
    const onStorage = (e) => {
      // cross-tab: if the same user's favorites key changed, reload
      const expectedKey = storageKeyFor(userKey);
      if (e.key === expectedKey) {
        setFavorites(readFavorites(userKey));
      }
    };
    window.addEventListener("favorites-updated", onFavoritesUpdated);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("favorites-updated", onFavoritesUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [userKey]);

  const currentRole = (role || "").toString().toLowerCase();
  const isAllowedToFav = useCallback((allowedRoles = []) => {
    if (!currentRole) return false;
    return allowedRoles.map((r) => String(r).toLowerCase()).includes(currentRole);
  }, [currentRole]);

  const toggleFavorite = (dashboardId, allowedRoles, e) => {
    // prevent navigation when clicking star
    if (e && e.preventDefault) e.preventDefault();
    if (!isAllowedToFav(allowedRoles)) {
      alert("You don't have permission to favourite this dashboard.");
      return;
    }
    const curr = !!(favorites && favorites[dashboardId]);
    const next = !curr;
    writeFavorite(userKey, dashboardId, next);
    setFavorites((prev) => ({ ...prev, [dashboardId]: next }));
  };

  return (
    <div>
      <div className="card-grid">
        {dashboards.map((d) => {
          const fav = !!(favorites && favorites[d.id]);
          const allowed = isAllowedToFav(d.allowedRoles);

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

      <div className="favorites-section">
        <h2>⭐ My Favorites</h2>

        <div className="favorites-grid">
          {dashboards
            .filter((d) => favorites[d.id])
            .map((d) => (
              <Link key={d.id} to={d.path} className="fav-card">
                <div
                  className="fav-star"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFavorite(d.id, d.allowedRoles, e);
                  }}
                >
                  ★
                </div>

                <div className="fav-image">
                  <img src={d.favImage} alt={d.title} />
                </div>

                <div className="fav-content">
                  <h3>{d.title}</h3>
                  <p>{d.desc}</p>
                </div>
              </Link>
            ))}
        </div>

        {Object.values(favorites).every((v) => !v) && <p className="empty-text">No favorites yet ⭐</p>}
      </div>
    </div>
  );
}