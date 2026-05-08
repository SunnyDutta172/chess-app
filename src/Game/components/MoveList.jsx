// MoveList.jsx — displays the list of moves made in the game
// Props:
//   history → array of moves e.g. ["e4", "e5", "Nf3"]
function MoveList({ history }) {
  return (
    <div className="move-list">
      <h3 className="move-list-title">Moves</h3>
      <div className="moves-grid">
        {history.length === 0 && <p className="no-moves">No moves yet</p>}
        {history.map((move, i) => (
          <div key={i} className={`move-entry ${i % 2 === 0 ? "white-move" : "black-move"}`}>
            {i % 2 === 0 && (
              <span className="move-num">{Math.floor(i / 2) + 1}.</span>
            )}
            <span className="move-text">{move}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MoveList