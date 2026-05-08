// ProfileCard.jsx — shows your stats
// Props: profile → user object from API
import "./ProfileCard.css"

function ProfileCard({ profile }) {
  if (!profile) return <div className="profile-card loading">Loading...</div>

  // win rate calculation
  const total   = profile.wins + profile.losses + profile.draws
  const winRate = total > 0 ? Math.round((profile.wins / total) * 100) : 0

  return (
    <div className="profile-card">
      <div className="profile-avatar">
        {profile.username[0].toUpperCase()}
      </div>
      <h2 className="profile-username">{profile.username}</h2>
      <div className="profile-elo">
        <span className="elo-number">{profile.elo}</span>
        <span className="elo-label">ELO</span>
      </div>
      <div className="profile-stats">
        <div className="stat">
          <span className="stat-number green">{profile.wins}</span>
          <span className="stat-label">Wins</span>
        </div>
        <div className="stat">
          <span className="stat-number red">{profile.losses}</span>
          <span className="stat-label">Losses</span>
        </div>
        <div className="stat">
          <span className="stat-number grey">{profile.draws}</span>
          <span className="stat-label">Draws</span>
        </div>
      </div>
      <div className="win-rate">
        <div className="win-rate-bar">
          <div className="win-rate-fill" style={{ width: `${winRate}%` }}></div>
        </div>
        <span className="win-rate-text">{winRate}% Win Rate</span>
      </div>
    </div>
  )
}

export default ProfileCard