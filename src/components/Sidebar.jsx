import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";

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

  const currentRole = (role || (user && (user.role?.name || user.role)) || "")
    .toString()
    .toLowerCase();

  const isAdmin = currentRole === "admin";

  return (
    <>
      {/* ===== NAVBAR ===== */}
      <div className="navbar">
        {/* LOGO */}
        <div className="logo">
          <h2>
            Business <span>Intelligence</span>
          </h2>
          <p>PORTAL</p>
        </div>

        {/* NAV LINKS */}
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
            Home
          </NavLink>

          {(currentRole === "admin" || currentRole === "hr") && (
            <NavLink to="/employee" className={({ isActive }) => (isActive ? "active" : "")}>
              Employee
            </NavLink>
          )}

          {(currentRole === "admin" || currentRole === "manager" || currentRole === "finance manager") && (
            <NavLink to="/project" className={({ isActive }) => (isActive ? "active" : "")}>
              Projects
            </NavLink>
          )}

          {(currentRole === "admin" || currentRole === "analyst") && (
            <NavLink to="/performance" className={({ isActive }) => (isActive ? "active" : "")}>
              Performance
            </NavLink>
          )}

          {(currentRole === "admin" || currentRole === "manager" || currentRole === "hr") && (
            <NavLink to="/hiring" className={({ isActive }) => (isActive ? "active" : "")}>
              Hiring
            </NavLink>
          )}
        </div>

        {/* RIGHT SECTION */}
        <div className="right-section">
          {user ? (
            <div className="avatar-wrapper" ref={ref}>
              {/* ✅ GRADIENT AVATAR */}
              <div
                className="avatar"
                onClick={() => setOpen(!open)}
              >
                {(user.username || "U").charAt(0).toUpperCase()}
              </div>

              {open && (
                <div className="dropdown">
                  <div className="dropdown-header">
                    <p className="name">{user.username}</p>
                    <p className="email">{user.email}</p>
                    <p className="role">
                      {(user?.role?.name || user?.role || "—").toString()}
                    </p>
                  </div>

                  {isAdmin && (
                    <div
                      className="dropdown-item"
                      onClick={() => {
                        setOpen(false);
                        navigate("/admin/create-user");
                      }}
                    >
                      User Provisioning
                    </div>
                  )}

                  <div
                    className="dropdown-item logout"
                    onClick={() => {
                      setOpen(false);
                      onLogout();
                    }}
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

      {/* ===== CSS ===== */}
      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          height: 72px;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          backdrop-filter: blur(20px);
          background: rgba(255, 255, 255, 0.7);
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .logo h2 {
          font-size: 18px;
          font-weight: 800;
          margin: 0;
        }

        .logo span {
          background: linear-gradient(135deg, #6366f1, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .logo p {
          font-size: 10px;
          color: #888;
          margin: 0;
          letter-spacing: 1px;
        }

        .nav-links {
          display: flex;
          gap: 8px;
          background: rgba(0,0,0,0.03);
          padding: 6px;
          border-radius: 20px;
        }

        .nav-links a {
          padding: 10px 18px;
          border-radius: 16px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          color: #777;
          transition: 0.3s;
        }

        .nav-links a:hover {
          background: rgba(0,0,0,0.05);
          color: #000;
        }

        .nav-links a.active {
          background: rgba(99,102,241,0.1);
          color: #6366f1;
          position: relative;
        }

        .nav-links a.active::after {
          content: "";
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 2px;
          background: #6366f1;
          border-radius: 10px;
        }

        .avatar-wrapper {
          position: relative;
        }

        /* 🔥 GRADIENT AVATAR */
        .avatar {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          cursor: pointer;

          background: linear-gradient(135deg, #6366f1, #a855f7);

          box-shadow: 0 6px 18px rgba(99,102,241,0.4);
          border: 2px solid rgba(255,255,255,0.6);

          transition: all 0.3s ease;
        }

        .avatar:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 10px 25px rgba(99,102,241,0.5);
        }

        .dropdown {
          position: absolute;
          top: 60px;
          right: 0;
          width: 220px;
          background: white;
          border-radius: 14px;
          box-shadow: 0 15px 40px rgba(0,0,0,0.1);
          overflow: hidden;
          animation: fadeIn 0.2s ease;
        }

        .dropdown-header {
          padding: 12px;
          border-bottom: 1px solid #eee;
        }

        .dropdown-item {
          padding: 10px;
          cursor: pointer;
        }

        .dropdown-item:hover {
          background: #f5f5f5;
        }

        .logout {
          color: red;
        }

        .btn.login {
          padding: 8px 16px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #a229b0, #a855f7);
          color: white;
          cursor: pointer;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
          /* =========================
   RESPONSIVE NAVBAR
========================= */

/* Hide hamburger on desktop */
.menu-toggle {
  display: none;
  font-size: 22px;
  cursor: pointer;
}

/* 🟡 Tablet */
@media (max-width: 900px) {
  .navbar {
    padding: 0 20px;
  }

  .nav-links a {
    padding: 8px 12px;
    font-size: 13px;
  }
}


/* 🟠 Mobile */
@media (max-width: 768px) {

  /* show hamburger */
  .menu-toggle {
    display: block;
  }

  /* stack layout */
  .navbar {
    flex-wrap: wrap;
    height: auto;
    padding: 12px 16px;
  }

  /* hide nav by default */
  .nav-links {
    position: absolute;
    top: 70px;
    left: 16px;
    right: 16px;

    flex-direction: column;
    align-items: flex-start;

    background: white;
    padding: 12px;
    border-radius: 14px;

    box-shadow: 0 10px 30px rgba(0,0,0,0.08);

    opacity: 0;
    pointer-events: none;
    transform: translateY(-10px);
    transition: 0.3s;
  }

  /* show when open */
  .nav-links.open {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }

  .nav-links a {
    width: 100%;
    padding: 10px;
  }

  /* move avatar right */
  .right-section {
    margin-left: auto;
  }
}


/* 🔴 Small Mobile */
@media (max-width: 420px) {

  .logo h2 {
    font-size: 14px;
  }

  .logo p {
    font-size: 8px;
  }

  .avatar {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }

  .dropdown {
    width: 180px;
  }
}
      `}</style>
    </>
  );
}

export default Sidebar;