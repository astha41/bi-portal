// frontend/src/App.js
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import myTheme from "./theme";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ProjectDashboard from "./pages/ProjectDashboard";
import PerformanceDashboard from "./pages/PerformanceDashboard";
import HiringDashboard from "./pages/HiringDashboard";
import Login from "./pages/Login";
import AdminCreateUser from "./pages/AdminCreateUser";

import { getCurrentUser } from "./api/api";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then((data) => {
        setUser(data);
        // support role either as object {name} or simple string
        const r = data?.role?.name || data?.role;
        setRole(r?.toString().toLowerCase() || null);
      })
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setRole(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      <ThemeProvider theme={myTheme}>
        {!user ? (
          <Login setUser={setUser} setRole={setRole} />
        ) : (
          <>
            <Sidebar user={user} role={role} onLogout={handleLogout} />
            <div className="main-content">
              <Routes>
                <Route path="/" element={<Home user={user} role={role} />} />

                <Route
                  path="/employee"
                  element={
                    <ProtectedRoute role={role} allowedRoles={["admin"]}>
                      <EmployeeDashboard user={user} role={role} />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/project"
                  element={
                    <ProtectedRoute role={role} allowedRoles={["admin", "manager"]}>
                      <ProjectDashboard user={user} role={role} />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/performance"
                  element={
                    <ProtectedRoute role={role} allowedRoles={["admin", "analyst"]}>
                      <PerformanceDashboard user={user} role={role} />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/hiring"
                  element={
                    <ProtectedRoute role={role} allowedRoles={["admin", "manager"]}>
                      <HiringDashboard user={user} role={role} />
                    </ProtectedRoute>
                  }
                />

                {/* Admin provisioning page */}
                <Route
                  path="/admin/create-user"
                  element={
                    <ProtectedRoute role={role} allowedRoles={["admin"]}>
                      <AdminCreateUser />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </>
        )}
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;