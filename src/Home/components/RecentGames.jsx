// RecentGames.jsx — shows last 10 games
// Props: games → array of game objects from API
//        username → logged in user's name
import "./RecentGames.css"

function RecentGames({ games, username }) {
  if (!games) return <div className="recent-games loading">Loading games...</div>

  if (games.length === 0) {
    return (
      <div className="recent-games">
        <h3 className="section-title">Recent Games</h3>
        <p className="no-games">No games played yet. Go play!</p>
      </div>
    )
  }

  return (
    <div className="recent-games">
      <h3 className="section-title">Recent Games</h3>
      <div className="games-list">
        {games.map((game, i) => {
          // figure out if I was white or black
          const iWasWhite = game.whitePlayer.username === username
          const myColor   = iWasWhite ? "white" : "black"
          const opponent  = iWasWhite ? game.blackPlayer : game.whitePlayer

          // did I win, lose, or draw?
          const result = game.result === myColor ? "win"
                       : game.result === "draw"  ? "draw"
                       : "loss"

          // ELO change for me
          const eloChange = iWasWhite ? game.whiteEloChange : game.blackEloChange
          const eloSign   = eloChange > 0 ? "+" : ""

          // format date
          const date = new Date(game.createdAt).toLocaleDateString()

          return (
            <div key={i} className={`game-row ${result}`}>
              <div className="game-result-badge">{result.toUpperCase()}</div>
              <div className="game-info">
                <span className="game-opponent">vs {opponent.username}</span>
                <span className="game-detail">
                  {iWasWhite ? "White" : "Black"} · {game.endReason} · {date}
                </span>
              </div>
              <div className={`game-elo ${eloChange > 0 ? "positive" : eloChange < 0 ? "negative" : ""}`}>
                {eloSign}{eloChange}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default RecentGames