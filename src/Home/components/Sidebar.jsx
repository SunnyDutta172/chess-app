// Sidebar.jsx — left navigation
// Props: activePage → which page is currently active
import { useNavigate } from "react-router-dom"
import "./Sidebar.css"

function Sidebar({ activePage }) {
  const navigate = useNavigate()

  const links = [
    { id: "home",    label: "🏠 Home",    path: "/home" },
    { id: "game",    label: "♟️ Play",    path: "/game" },
    { id: "profile", label: "👤 Profile", path: "/profile" },
  ]

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/login")
  }

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon"></div>
        <span className="logo-text">Chess<span>.com</span></span>
      </div>

      <nav className="sidebar-nav">
        {links.map(link => (
          <button
            key={link.id}
            className={`nav-link ${activePage === link.id ? "active" : ""}`}
            onClick={() => navigate(link.path)}
          >
            {link.label}
          </button>
        ))}
      </nav>

      <button className="logout-link" onClick={handleLogout}>
        🚪 Log Out
      </button>
    </div>
  )
}

export default Sidebar