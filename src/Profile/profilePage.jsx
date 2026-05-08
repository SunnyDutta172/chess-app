import { useState, useEffect } from "react"
import Sidebar     from "../Home/components/Sidebar"
import ProfileCard from "../Home/components/ProfileCard"
import RecentGames from "../Home/components/RecentGames"
import "./profilePage.css"

function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [games, setGames]     = useState(null)
  const token    = localStorage.getItem("token")
  const user     = JSON.parse(localStorage.getItem("user"))

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [profileRes, gamesRes] = await Promise.all([
        fetch("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("http://localhost:5000/api/games/history", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      setProfile(await profileRes.json())
      setGames(await gamesRes.json())
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <div className="profile-page">
      <Sidebar activePage="profile" />
      <div className="profile-content">
        <h1 className="page-title">My Profile</h1>
        <div className="profile-grid">
          <ProfileCard profile={profile} />
          <RecentGames games={games} username={user?.username} />
        </div>
      </div>
    </div>
  )
}

export default ProfilePage