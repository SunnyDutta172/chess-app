require("dotenv").config({ path: require("path").resolve(__dirname, ".env") })

const express    = require("express")
const mongoose   = require("mongoose")
const cors       = require("cors")
const http       = require("http")
const { Server } = require("socket.io")

const authRoutes  = require("./routes/auth")
const userRoutes  = require("./routes/users")   
const gameRoutes  = require("./routes/games")   

const app    = express()
const server = http.createServer(app)

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL  // your Vercel URL — set this later
]

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] }
})

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())

app.use("/api/auth",  authRoutes)
app.use("/api/users", userRoutes)  // NEW
app.use("/api/games", gameRoutes)  // NEW

const rooms = {}

io.on("connection", (socket) => {
  console.log(`✅ Player connected: ${socket.id}`)

  // mark user as online in DB
  socket.on("userOnline", async ({ userId }) => {
    const User = require("./models/User")
    await User.findByIdAndUpdate(userId, { isOnline: true })
    socket.userId = userId  // store on socket for disconnect
  })

socket.on("createRoom", ({ username, userId }) => {
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  rooms[roomCode] = {
    fen: "start",
    players: [{ id: socket.id, username, userId, color: "w" }],  // ← add userId
    moves: [],
    startTime: Date.now()
  }
  socket.join(roomCode)
  socket.emit("roomCreated", { roomCode, color: "w" })
})

socket.on("joinRoom", ({ roomCode, username, userId }) => {
  const room = rooms[roomCode.toUpperCase()]
  if (!room) { socket.emit("error", { message: "Room not found!" }); return }
  if (room.players.length >= 2) { socket.emit("error", { message: "Room is full!" }); return }

  room.players.push({ id: socket.id, username, userId, color: "b" })  // ← add userId
  socket.join(roomCode.toUpperCase())
  socket.emit("roomJoined", { roomCode: roomCode.toUpperCase(), color: "b", fen: room.fen })
  io.to(roomCode.toUpperCase()).emit("gameStart", {
    players: room.players.map(p => ({
      username: p.username,
      userId: p.userId,   // ← send userId to frontend
      color: p.color
    }))
  })
})

  socket.on("move", ({ roomCode, fen, move }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].fen = fen
      rooms[roomCode].moves.push(move)  // track moves for saving
      socket.to(roomCode).emit("opponentMove", { fen, move })
    }
  })

  // ── CHAT ─────────────────────────────────────────────────
  // When a player sends a chat message:
  // emit to everyone in the room including sender
  socket.on("chatMessage", ({ roomCode, message, username }) => {
    io.to(roomCode).emit("chatMessage", {
      username,
      message,
      // Date.now() gives timestamp in milliseconds
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    })
  })

  // ── REMATCH ───────────────────────────────────────────────
  socket.on("rematchRequest", ({ roomCode }) => {
    socket.to(roomCode).emit("rematchRequested")
  })

  socket.on("rematchAccept", ({ roomCode }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].fen   = "start"
      rooms[roomCode].moves = []
      rooms[roomCode].startTime = Date.now()
      rooms[roomCode].players = rooms[roomCode].players.map(p => ({
        ...p,
        color: p.color === "w" ? "b" : "w"
      }))
      io.to(roomCode).emit("rematchStart", {
        players: rooms[roomCode].players
      })
    }
  })

  socket.on("disconnect", async () => {
    // mark user as offline
    if (socket.userId) {
      const User = require("./models/User")
      await User.findByIdAndUpdate(socket.userId, { isOnline: false })
    }
    for (const [code, room] of Object.entries(rooms)) {
      const idx = room.players.findIndex(p => p.id === socket.id)
      if (idx !== -1) {
        socket.to(code).emit("opponentLeft")
        room.players.splice(idx, 1)
        if (room.players.length === 0) delete rooms[code]
        break
      }
    }
  })
})
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ Connected to MongoDB")
        server.listen(process.env.PORT || 5000, () => {
            console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
        })
    })
    .catch((err) => {
        console.log("❌ MongoDB connection failed", err.message)
    })