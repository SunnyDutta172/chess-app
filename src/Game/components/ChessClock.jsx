// ChessClock.jsx — displays a countdown timer
// Props:
//   seconds  → how many seconds left
//   isActive → is this clock currently ticking?
function ChessClock({ seconds, isActive }) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  const isLow = seconds <= 30

  return (
    <div className={`clock ${isActive ? "clock-active" : ""} ${isLow ? "clock-low" : ""}`}>
      {display}
    </div>
  )
}

export default ChessClock