// homePage.jsx — the main dashboard
// Shows profile, recent games, friends, and play button
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar      from "./components/Sidebar"
import ProfileCard  from "./components/ProfileCard"
import RecentGames  from "./components/RecentGames"
import FriendsList  from "./components/FriendsList"
import BASE_URL from "../config"
import "./homePage.css"

function HomePage() {
  const [profile, setProfile]   = useState(null)
  const [games, setGames]       = useState(null)
  const navigate                = useNavigate()
  const token                   = localStorage.getItem("token")
  const user                    = JSON.parse(localStorage.getItem("user"))

  // fetch profile and game history when page loads
  useEffect(() => {
    fetchProfile()
    fetchGames()
  }, [])

  const fetchProfile = async () => {
    try {
      const res  = await fetch(`${BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setProfile(data)
    } catch (err) {
      console.log(err)
    }
  }

  const fetchGames = async () => {
    try {
      const res  = await fetch(`${BASE_URL}/api/games/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setGames(data)
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <div className="dashboard">
      <Sidebar activePage="home" />

      <div className="dashboard-content">

        {/* TOP — welcome banner + play button */}
        <div className="welcome-banner">
          <div>
            <h1 className="welcome-title">
              Welcome back, {user?.username}! ♟️
            </h1>
            <p className="welcome-sub">
              Ready to play? Create a game and challenge a friend.
            </p>
          </div>
          <button
            className="play-btn"
            onClick={() => navigate("/game")}
          >
            Play Now
          </button>
        </div>

        {/* MAIN GRID */}
        <div className="dashboard-grid">

          {/* LEFT COLUMN */}
          <div className="left-col">
            <ProfileCard profile={profile} />
            <FriendsList
              friends={profile?.friends}
              friendRequests={profile?.friendRequests}
              onRefresh={fetchProfile}
            />
          </div>

          {/* RIGHT COLUMN */}
          <div className="right-col">
            <RecentGames
              games={games}
              username={user?.username}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage