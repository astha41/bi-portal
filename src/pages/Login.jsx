import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../api/api"; // ensure this exists
import "./Login.css";

/* 
  Aesthetic Login with client-side numeric captcha.
  Updated: captcha buttons are now styled "captcha-btn" (pill buttons with icons).
*/

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCaptchaValue(length = 5) {
  let s = "";
  for (let i = 0; i < length; i++) s += String(randInt(0, 9));
  return s;
}

function drawCaptchaToCanvas(canvas, text) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(1, "#f3f6fb");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = `rgba(${randInt(100,180)}, ${randInt(100,180)}, ${randInt(100,180)}, 0.14)`;
    ctx.beginPath();
    ctx.moveTo(randInt(0, w), randInt(0, h));
    ctx.lineTo(randInt(0, w), randInt(0, h));
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const charCount = text.length;
  ctx.textBaseline = "middle";
  for (let i = 0; i < charCount; i++) {
    const ch = text[i];
    const x = (w / (charCount + 1)) * (i + 1) + randInt(-6, 6);
    const y = h / 2 + randInt(-6, 6);
    const angle = (randInt(-18, 18) * Math.PI) / 180;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const fontSize = Math.floor(h * 0.6) + randInt(-4, 4);
    ctx.font = `700 ${fontSize}px Inter, "Segoe UI", Roboto, Arial, sans-serif`;
    ctx.fillStyle = `rgba(${randInt(20, 90)}, ${randInt(20, 90)}, ${randInt(20, 90)}, 0.95)`;
    ctx.fillText(ch, -fontSize / 2 + randInt(-2, 2), randInt(-2, 2));
    ctx.restore();
  }

  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(${randInt(100, 220)}, ${randInt(100, 220)}, ${randInt(100, 220)}, 0.12)`;
    ctx.beginPath();
    ctx.arc(randInt(0, w), randInt(0, h), Math.random() * 2 + 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function Login({ setUser, setRole }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // ADDED
  const [captchaValue, setCaptchaValue] = useState(generateCaptchaValue(5));
  const [captchaInput, setCaptchaInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const canvasRef = useRef(null);

  useEffect(() => {
    drawCaptchaToCanvas(canvasRef.current, captchaValue);
  }, [captchaValue]);

  const toggleShowPassword = () => setShowPassword((v) => !v); // ADDED

  const refreshCaptcha = () => {
    setRefreshing(true);
    setTimeout(() => {
      setCaptchaValue(generateCaptchaValue(5));
      setCaptchaInput("");
      setRefreshing(false);
      setError("");
    }, 260);
  };

  const readCaptchaAloud = () => {
    try {
      const utter = new SpeechSynthesisUtterance(captchaValue.split("").join(" "));
      speechSynthesis.speak(utter);
    } catch {
      // ignore if unavailable
    }
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter username and password.");
      return;
    }

    if (!captchaInput.trim()) {
      setError("Please enter the captcha number shown.");
      return;
    }

    if (captchaInput.trim() !== captchaValue) {
      setError("Captcha incorrect. Try again.");
      setCaptchaValue(generateCaptchaValue(5));
      setCaptchaInput("");
      return;
    }

    setLoading(true);

    try {
      const body = new URLSearchParams({ username, password });
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:8000"}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        const msg = (j && (j.detail || j.message)) || `Login failed (${res.status})`;
        throw new Error(msg);
      }

      const payload = await res.json();
      const token = payload?.access_token;
      if (!token) throw new Error("Login response missing access token.");

      localStorage.setItem("token", token);

      const me = await getCurrentUser();
      setUser(me);
      setRole(me?.role?.name?.toLowerCase() || null);

      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
      setCaptchaValue(generateCaptchaValue(5));
      setCaptchaInput("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-brand">
            <div className="logo-circle">BI</div>
            <div>
              <h1>Login</h1>
              <p className="subtitle">Welcome back — please login to continue</p>
            </div>
          </div>

          {error && <div className="login-error" role="alert">{error}</div>}

          <form onSubmit={submitLogin} className="login-form" aria-label="login-form">
            <label className="field-label">Username</label>
            <input
              className="input-field"
              placeholder="Username"
              value={username}
              autoComplete="username"
              onChange={(e) => setUsername(e.target.value)}
              aria-label="username"
            />

            <label className="field-label">Password</label>

            {/* PASSWORD WRAPPER (scoped to login card only) */}
            <div className="login-password-wrapper">
              <input
                className="input-field login-password-input"
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                aria-label="password"
              />

              <button
                type="button"
                className="login-password-toggle"
                onClick={toggleShowPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M3 12s4-7 9-7 9 7 9 7-4 7-9 7-9-7-9-7z" stroke="#374151" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="#374151" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
  <path
    d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"
    stroke="#374151"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
  <path
    d="M3 3l18 18"
    stroke="#374151"
    strokeWidth="1.5"
    strokeLinecap="round"
  />
</svg>
                )}
              </button>
            </div>

            <div className="captcha-block">
              <div className="captcha-left">
                <label className="field-label small">Enter the number shown below</label>
                <div className={`captcha-canvas-wrap ${refreshing ? "pulse" : ""}`}>
                  <canvas ref={canvasRef} width={220} height={56} aria-hidden="true" />
                </div>
                <div className="captcha-actions">
                  <button
                    type="button"
                    className="captcha-btn"
                    onClick={refreshCaptcha}
                    aria-label="Refresh captcha"
                    title="Generate a new captcha"
                  >
                    <span className="btn-icon">↻</span>
                    <span className="btn-text">Refresh</span>
                  </button>

                  <button
                    type="button"
                    className="captcha-btn secondary"
                    onClick={readCaptchaAloud}
                    aria-label="Read captcha aloud"
                    title="Read the captcha digits aloud"
                  >
                    <span className="btn-icon">🔊</span>
                    <span className="btn-text">Read</span>
                  </button>
                </div>
              </div>

              <div className="captcha-right">
                <label className="field-label small">Type number</label>
                <input
                  className="input-field"
                  placeholder="Type number"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  aria-label="captcha-input"
                />
              </div>
            </div>

            <button className="submit-button" type="submit" disabled={loading}>
              {loading ? "loging in…" : "log in"}
            </button>
          </form>

          <div className="login-footer">
            <small>Need help? Contact your administrator.</small>
          </div>
        </div>
      </div>
    </div>
  );
}