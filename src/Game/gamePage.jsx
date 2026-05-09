import React, { useState, useEffect, useRef } from "react"
import { Chessboard } from "react-chessboard"
import { Chess } from "chess.js"
import { useNavigate, useLocation } from "react-router-dom"
import socket from "../hooks/useSocket"
import ChessClock from "./components/ChessClock"
import MoveList   from "./components/MoveList"
import ChatBox    from "./components/ChatBox"
import "./gamePage.css"
import BASE_URL from "../config"

function GamePage() {
  const [game, setGame]             = useState(() => new Chess())
  const [status, setStatus]         = useState("")
  const [myColor, setMyColor]       = useState(null)
  const [roomCode, setRoomCode]     = useState("")
  const [joinInput, setJoinInput]   = useState("")
  const [gamePhase, setGamePhase]   = useState("lobby")
  const [opponent, setOpponent]     = useState(null)
  const [errorMsg, setErrorMsg]     = useState("")
  const [allPlayers, setAllPlayers] = useState([])
  const [copied, setCopied]         = useState(false)
  const [whiteTime, setWhiteTime]   = useState(600)
  const [blackTime, setBlackTime]   = useState(600)
  const [rematchRequested, setRematchRequested] = useState(false)
  const [rematchPending, setRematchPending]     = useState(false)
  const [gameStartTime, setGameStartTime]       = useState(null)

  const timerRef = useRef(null)
  const user     = JSON.parse(localStorage.getItem("user"))
  const navigate = useNavigate()

  // timer logic
  useEffect(() => {
    if (gamePhase !== "playing" || status !== "") {
      clearInterval(timerRef.current)
      return
    }
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      if (game.turn() === "w") {
        setWhiteTime(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            setStatus("Time's up! Black wins! ⏱️")
            handleGameEnd("black", "timeout")
            return 0
          }
          return prev - 1
        })
      } else {
        setBlackTime(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            setStatus("Time's up! White wins! ⏱️")
            handleGameEnd("white", "timeout")
            return 0
          }
          return prev - 1
        })
      }
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [game, gamePhase, status])

  // socket events
  useEffect(() => {
    // mark user as online
    socket.emit("userOnline", { userId: user.id })

    socket.on("roomCreated", ({ roomCode, color }) => {
      setRoomCode(roomCode)
      setMyColor(color)
      setGamePhase("waiting")
    })

    socket.on("roomJoined", ({ roomCode, color, fen }) => {
      setRoomCode(roomCode)
      setMyColor(color)
      setGame(new Chess(fen === "start" ? undefined : fen))
    })

    socket.on("gameStart", ({ players }) => {
      gameSavedRef.current = false
      setGamePhase("playing")
      setAllPlayers(players)
      setStatus("")
      setWhiteTime(600)
      setBlackTime(600)
      setGameStartTime(Date.now())
      setRematchRequested(false)
      setRematchPending(false)
      setGame(new Chess())
    })

    socket.on("opponentMove", ({ fen }) => {
      const newGame = new Chess(fen)
      setGame(newGame)
      if (newGame.isCheckmate())  setStatus("Checkmate! You lost 😢")
      else if (newGame.isDraw())  setStatus("Draw! 🤝")
      else if (newGame.isCheck()) setStatus("You are in Check! ⚠️")
      else                        setStatus("")
    })

    socket.on("opponentLeft", () => {
      setStatus("Opponent disconnected 👋")
      setGamePhase("lobby")
      clearInterval(timerRef.current)
    })

    socket.on("rematchRequested", () => setRematchRequested(true))

    socket.on("rematchStart", ({ players }) => {
      gameSavedRef.current = false
      setAllPlayers(players)
      setGame(new Chess())
      setStatus("")
      setWhiteTime(600)
      setBlackTime(600)
      setRematchRequested(false)
      setRematchPending(false)
      setGamePhase("playing")
      setGameStartTime(Date.now())
    })

    socket.on("error", ({ message }) => setErrorMsg(message))

    return () => {
      socket.off("roomCreated")
      socket.off("roomJoined")
      socket.off("gameStart")
      socket.off("opponentMove")
      socket.off("opponentLeft")
      socket.off("rematchRequested")
      socket.off("rematchStart")
      socket.off("error")
    }
  }, [])

  // find opponent after myColor set
  useEffect(() => {
    if (allPlayers.length === 2 && myColor) {
      const opp = allPlayers.find(p => p.color !== myColor)
      setOpponent(opp)
    }
  }, [allPlayers, myColor])

  // save game to database when it ends
  // Add this ref at the top with other refs
const gameSavedRef = useRef(false)

// Replace handleGameEnd with this
const handleGameEnd = async (result, endReason) => {
  if (gameSavedRef.current) return
  gameSavedRef.current = true
  clearInterval(timerRef.current)

  try {
    const token    = localStorage.getItem("token")
    const duration = gameStartTime
      ? Math.floor((Date.now() - gameStartTime) / 1000) : 0

    const white = allPlayers.find(p => p.color === "w")
    const black = allPlayers.find(p => p.color === "b")
    if (!white || !black) return

    await fetch(`${BASE_URL}/api/games/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        whitePlayer: { userId: white.userId, username: white.username },
        blackPlayer: { userId: black.userId, username: black.username },
        result,
        endReason,
        moves: game.history(),
        duration
      })
    })
  } catch (err) {
    console.log("Error saving game:", err)
  }
}

  const onDrop = (sourceSquare, targetSquare) => {
    if (gamePhase !== "playing") return false
    if (game.turn() !== myColor) return false

    const gameCopy = new Chess(game.fen())
    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q"
      })
      if (!move) return false

      let result = null
      if (gameCopy.isCheckmate()) {
        const winner = myColor === "w" ? "white" : "black"
        setStatus("Checkmate! You win! 🏆")
        result = winner
        handleGameEnd(winner, "checkmate")
      } else if (gameCopy.isDraw()) {
        setStatus("Draw! 🤝")
        result = "draw"
        handleGameEnd("draw", "draw")
      } else if (gameCopy.isCheck()) {
        setStatus("Check! ⚠️")
      } else {
        setStatus("")
      }

      setTimeout(() => setGame(gameCopy), 0)
      socket.emit("move", { roomCode, fen: gameCopy.fen(), move: move.san })
      return true
    } catch { return false }
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const requestRematch = () => {
    setRematchPending(true)
    socket.emit("rematchRequest", { roomCode })
  }

  const acceptRematch = () => {
    socket.emit("rematchAccept", { roomCode })
  }

  const createRoom = () => {
  socket.emit("createRoom", {
    username: user.username,
    userId: user.id        // ← add userId
  })
}

  const joinRoom = () => {
    if (!joinInput.trim()) return
    setErrorMsg("")
    socket.emit("joinRoom", { roomCode: joinInput.trim(), username: user.username,
      userId: user.id
     })
  }

  return (
    <div className="game-page">
      <nav className="navbar">
        <div className="nav-left">
          <button className="back-btn" onClick={() => navigate("/home")}>← Home</button>
          <div className="logo-icon"></div>
          <span className="nav-title">Chess<span className="nav-dot">.com</span></span>
        </div>
        <div className="nav-right">
          <div className="nav-user">
            <div className="avatar">{user?.username?.[0].toUpperCase()}</div>
            <span>{user?.username}</span>
          </div>
        </div>
      </nav>

      <div className="game-container">
        <div className="board-section">
          <div className="player-bar">
            <div className="player-info">
              <div className="player-avatar black">
                {opponent ? opponent.username[0].toUpperCase() : "?"}
              </div>
              <span className="player-name">
                {opponent ? opponent.username : "Waiting..."}
              </span>
            </div>
            {gamePhase === "playing" && (
              <ChessClock
                seconds={myColor === "w" ? blackTime : whiteTime}
                isActive={game.turn() !== myColor && !status}
              />
            )}
          </div>

          <Chessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            boardWidth={500}
            animationDuration={0}
            boardOrientation={myColor === "b" ? "black" : "white"}
            customDarkSquareStyle={{ backgroundColor: "#769656" }}
            customLightSquareStyle={{ backgroundColor: "#eeeed2" }}
            customBoardStyle={{
              borderRadius: "4px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.6)"
            }}
          />

          <div className="player-bar">
            <div className="player-info">
              <div className="player-avatar white">
                {user?.username?.[0].toUpperCase()}
              </div>
              <span className="player-name">{user?.username}</span>
            </div>
            {gamePhase === "playing" && (
              <ChessClock
                seconds={myColor === "w" ? whiteTime : blackTime}
                isActive={game.turn() === myColor && !status}
              />
            )}
          </div>
        </div>

        <div className="info-panel">
          {status && (
            <div className="status-box">
              <p>{status}</p>
              {gamePhase === "playing" && (
                <div className="rematch-section">
                  {!rematchPending && !rematchRequested && (
                    <button className="rematch-btn" onClick={requestRematch}>
                      Rematch
                    </button>
                  )}
                  {rematchPending && !rematchRequested && (
                    <p className="rematch-waiting">Waiting for opponent...</p>
                  )}
                  {rematchRequested && (
                    <button className="rematch-btn accept" onClick={acceptRematch}>
                      Accept Rematch!
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {gamePhase === "lobby" && (
            <div className="lobby-panel">
              <h3 className="panel-title">Play Online</h3>
              <button className="create-btn" onClick={createRoom}>
                Create Game
              </button>
              <div className="divider-row">
                <span></span><p>OR</p><span></span>
              </div>
              <input
                className="room-input"
                placeholder="Enter room code"
                value={joinInput}
                onChange={e => setJoinInput(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button className="join-btn" onClick={joinRoom}>
                Join Game
              </button>
              {errorMsg && <p className="error-msg">{errorMsg}</p>}
            </div>
          )}

          {gamePhase === "waiting" && (
            <div className="waiting-panel">
              <h3 className="panel-title">Game Created!</h3>
              <p className="waiting-text">Share this code:</p>
              <div className="room-code-display">{roomCode}</div>
              <button className="copy-btn" onClick={copyRoomCode}>
                {copied ? "✅ Copied!" : "📋 Copy Code"}
              </button>
              <p className="waiting-text">Waiting for opponent...</p>
              <div className="spinner"></div>
            </div>
          )}

          {gamePhase === "playing" && !status && (
            <MoveList history={game.history()} />
          )}

          {gamePhase === "playing" && (
            <ChatBox roomCode={roomCode} username={user.username} />
          )}
        </div>
      </div>
    </div>
  )
}

export default GamePage