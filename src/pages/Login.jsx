import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, getCurrentUser } from "../api/api";
import "./Login.css";

export default function Login({ setUser, setRole }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1) login stores the token (as before)
      await login(username, password);

      // 2) fetch the logged-in user
      const me = await getCurrentUser();

      setUser(me);
      setRole(me?.role?.name?.toLowerCase() || null);

      navigate("/");
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-card">
        <h2>Login</h2>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}