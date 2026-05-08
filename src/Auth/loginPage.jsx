import React, {useState} from "react";
import "./loginPage.css"
import { useNavigate, Link } from "react-router-dom"; 
function SocialButton({label}) {
    return (
        <button className="social-btn">
            {label}
        </button>
    )
}
function LoginPage(){
    const[username, setUsername] = useState("");
    const[password, setPassword] = useState("");
    const[showPass, setShowPass] = useState(false);
    const navigate = useNavigate();
    const handleLogin = async () => {
        if(!username || !password){
            alert(`Please fill in all fields!`);
            return;
        }
        try {
            const response = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
            })
            const data = await response.json();
            if(!response.ok){
                alert(data.message);
                return;
            }
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            navigate("/home");
        } catch(err){
            alert(`Could not connect to server.Is it running?`);
        }
    }
    return (
        <div className="page">
            <div className="logo-row">
            <div className="logo-icon"></div>
            <h1 className="logo-text">
                Chess<span>.com</span>
            </h1>
            </div>
            <div className="card">
                <input className= "text-input" type="text" 
                placeholder="Username, Phone, or Email"
                value = {username}
                onChange={(e) => setUsername(e.target.value)} />
                <div className="password-row">
                    <input className= "text-input"
                    type={showPass ? "text" : "password"} 
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}/>
                    <button className="show-btn"
                    onClick={() => setShowPass(!showPass)}>
                        {showPass ? "Hide" : "Show"}
                    </button>
                </div>
                <div className="option-row">
                    <label className="remember">
                        <input type="checkbox" defaultChecked />
                        Remember me
                    </label>
                    <a href="#" className="forgot">Forgot Password?</a>
                </div>
                <button className="login-btn" onClick={handleLogin}>
                    Log In 
                </button>
                <div className="divider">
                    <span></span><p>OR</p><span></span>
                </div>
                <SocialButton label = "Log in with Apple" />
                <SocialButton label = "Log in with Google" />
                <SocialButton label = "Log in with Facebook" />
                <p className="signup">
                    New? <Link to="/signup">Sign up</Link> - and start playing chess!
                </p>
            </div>
        </div>
        
    )
}

export default LoginPage;
