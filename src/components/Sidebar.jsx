import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

function Sidebar({ user, role, onLogout, onLoginClick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getAvatarColor = (name = "") => {
    if (!name) return "#6366f1";
    const colors = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
    return colors[name.charCodeAt(0) % colors.length];
  };

  // Determine admin status robustly (role prop or user.role.name)
  const currentRole = (role || (user && (user.role?.name || user.role)) || "").toString().toLowerCase();
  const isAdmin = currentRole === "admin";

  // Friendly name for the admin-only function
  // This is the menu label shown to admins.
  const adminFunctionLabel = "User Provisioning";

  return (
    <div className="navbar">
      <h2>Business Intelligence Portal</h2>

      <div className="nav-links">
        <Link to="/">Home</Link>

        {(currentRole === "admin" || currentRole === "hr") && <Link to="/employee">Employee</Link>}

        {(currentRole === "admin" || currentRole === "manager" || currentRole === "Finance") && (
          <Link to="/project">Projects</Link>
        )}

        {(currentRole === "admin" || currentRole === "analyst") && (
          <Link to="/performance">Performance</Link>
        )}

        {(currentRole === "admin" || currentRole === "manager" || currentRole === "hr") && (
          <Link to="/hiring">Hiring</Link>
        )}

        {user ? (
          <div className="avatar-wrapper" ref={ref}>
            {/* Avatar */}
            <div
              className="avatar"
              onClick={() => setOpen(!open)}
              style={{ background: getAvatarColor(user.username || "A") }}
            >
              {(user.username || "U").charAt(0).toUpperCase()}
            </div>

            {/* Dropdown */}
            {open && (
              <div className="dropdown" role="menu" aria-label="user-menu">
                <div className="dropdown-header">
                  <p className="name">{user.username}</p>
                  <p className="email">{user.email}</p>
                  <p className="role">{(user?.role?.name || user?.role || "—").toString()}</p>
                </div>

                {/* Admin-only function: User Provisioning */}
                {isAdmin && (
                  <div
                    className="dropdown-item"
                    onClick={() => {
                      setOpen(false);
                      navigate("/admin/create-user");
                    }}
                    role="menuitem"
                    style={{ cursor: "pointer" }}
                  >
                    {adminFunctionLabel}
                  </div>
                )}

                <div
                  className="dropdown-item logout"
                  onClick={() => {
                    setOpen(false);
                    onLogout();
                  }}
                  role="menuitem"
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