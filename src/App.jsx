import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import LoginPage   from "./Auth/loginPage"
import SignupPage  from "./Auth/signupPage"
import HomePage    from "./Home/homePage"
import GamePage    from "./Game/gamePage"
import ProfilePage from "./Profile/profilePage"

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token")
  if (!token) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<LoginPage />} />
        <Route path="/login"  element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/home"   element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/game"   element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App