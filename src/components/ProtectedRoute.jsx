import { Navigate, Link } from "react-router-dom";

export default function ProtectedRoute({ role, allowedRoles, children }) {

  // user not logged in
  if (!role) {
    return <Navigate to="/" />;
  }

  // role not allowed
  if (!allowedRoles.includes(role)) {
    return (
      <div style={{ textAlign: "center", marginTop: "80px" }}>
        <h1>403</h1>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this dashboard.</p>

        <Link to="/">
          <button style={{ padding: "8px 16px", marginTop: "10px" }}>
            Go Back Home
          </button>
        </Link>
      </div>
    );
  }

  return children;
}