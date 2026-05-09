import React, { useState } from "react";
import "./signupPage.css";
import { useNavigate, Link } from "react-router-dom";
import BASE_URL from "../config"

function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]     = useState({});
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (username.length < 3)
      newErrors.username = "Username must be at least 3 characters";
    if (!email.includes("@"))
      newErrors.email = "Please enter a valid email";
    if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    try {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors({ general: data.message });
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/home");
    } catch (err) {
      setErrors({ general: "Could not connect to server. Is it running?" });
    }
  };

  return (
    <div className="page">
      <div className="logo-row">
        <div className="logo-icon"></div>
        <h1 className="logo-text">Chess<span>.com</span></h1>
      </div>
      <div className="card">
        <h2 className="card-title">Create an account</h2>
        <input className="text-input" type="text"
          placeholder="Username"
          value={username} onChange={e => setUsername(e.target.value)}
        />
        {errors.username && <p className="error-msg">{errors.username}</p>}
        <input className="text-input" type="email"
          placeholder="Email address"
          value={email} onChange={e => setEmail(e.target.value)}
        />
        {errors.email && <p className="error-msg">{errors.email}</p>}
        <div className="password-row">
          <input className="text-input"
            type={showPass ? "text" : "password"}
            placeholder="Password (min 6 characters)"
            value={password} onChange={e => setPassword(e.target.value)}
          />
          <button className="show-btn" onClick={() => setShowPass(!showPass)}>
            {showPass ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && <p className="error-msg">{errors.password}</p>}
        {errors.general  && <p className="error-msg">{errors.general}</p>}
        <button className="signup-btn" onClick={handleSignup}>
          Create Account
        </button>
        <p className="login-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;