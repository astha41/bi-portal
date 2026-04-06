import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
function Sidebar({ user, role, onLogout, onLoginClick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

useEffect(() => {
  const handleClickOutside = (e) => {
    if (ref.current && !ref.current.contains(e.target)) {
      setOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
  const getAvatarColor = (name) => {
    const colors = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div className="navbar">
      <h2>Business Intelligence Portal</h2>

      <div className="nav-links">
        <Link to="/">Home</Link>

        {role === "admin" && <Link to="/employee">Employee</Link>}

        {(role === "admin" || role === "manager") && (
          <Link to="/project">Projects</Link>
        )}

        {(role === "admin" || role === "analyst") && (
          <Link to="/performance">Performance</Link>
        )}

        {(role === "admin" || role === "manager") && (
          <Link to="/hiring">Hiring</Link>
        )}

        {user ? (
          <div className="avatar-wrapper" ref={ref}>
            
            {/* Avatar */}
            <div
              className="avatar"
              onClick={() => setOpen(!open)}
              style={{ background: getAvatarColor(user.username) }}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>

            {/* Dropdown */}
            {open && (
              <div className="dropdown">
                <div className="dropdown-header">
                  <p className="name">{user.username}</p>
                  <p className="email">{user.email}</p>
                  <p className="role">
                   {(user?.role?.name || user?.role || "—").toString()}
                  </p>
                </div>

                

                <div
                  className="dropdown-item logout"
                  onClick={onLogout}
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        ) : (
          <button className="btn login" onClick={onLoginClick}>
            Sign In
          </button>
        )}
      </div>
    </div>
  );
}

export default Sidebar;