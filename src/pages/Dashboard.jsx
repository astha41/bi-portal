import { useEffect, useState } from "react";
import { getCurrentUser } from "../api/api";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const data = await getCurrentUser();
      setUser(data);
    }

    loadUser();
  }, []);

  if (!user) return <p>Loading...</p>;
  function logout() {
  localStorage.removeItem("token");
  window.location.reload();
}
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {user.username}</p>
      <p>Role ID: {user.role_id}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}