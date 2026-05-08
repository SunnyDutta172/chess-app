const express = require("express")
const router  = express.Router()
const Game    = require("../models/Game")
const User    = require("../models/User")
const jwt     = require("jsonwebtoken")

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) return res.status(401).json({ message: "No token" })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ message: "Invalid token" })
  }
}

// ── POST /api/games/save ─────────────────────────────────
router.post("/save", authMiddleware, async (req, res) => {
  try {
    const { whitePlayer, blackPlayer, result, endReason, moves, duration } = req.body

    console.log("Saving game:", { whitePlayer, blackPlayer, result }) // debug log

    // fetch REAL elo from database — don't trust what frontend sends
    // this prevents cheating and fixes the 0 ELO bug
    const whiteUser = await User.findById(whitePlayer.userId)
    const blackUser = await User.findById(blackPlayer.userId)

    if (!whiteUser || !blackUser) {
      return res.status(404).json({ message: "Player not found" })
    }

    // use real ELO from DB, fallback to 400 if somehow missing
    const whiteElo = whiteUser.elo || 400
    const blackElo = blackUser.elo || 400

    // ── ELO CALCULATION ──────────────────────────────────
    // K factor — how much ELO changes per game
    // We use 32 which is standard for new/casual players
    const K = 32

    // Expected score = how likely each player is to win
    // based purely on ELO difference
    // If both are equal → expected = 0.5 (50/50)
    // If white is 400 points higher → expected = 0.91 (91% chance)
    const expectedWhite = 1 / (1 + Math.pow(10, (blackElo - whiteElo) / 400))
    const expectedBlack = 1 - expectedWhite

    // Actual score
    // winner gets 1, loser gets 0, draw both get 0.5
    const actualWhite = result === "white" ? 1 : result === "draw" ? 0.5 : 0
    const actualBlack = 1 - actualWhite

    // ELO change = K × (actual - expected)
    // Win when expected to win → small gain (+5 to +10)
    // Win when expected to lose → big gain (+20 to +30)
    let whiteEloChange = Math.round(K * (actualWhite - expectedWhite))
    let blackEloChange = Math.round(K * (actualBlack - expectedBlack))

    // ── MINIMUM ELO: 400 ─────────────────────────────────
    // never let ELO drop below 400
    const newWhiteElo = Math.max(400, whiteElo + whiteEloChange)
    const newBlackElo = Math.max(400, blackElo + blackEloChange)

    // recalculate actual change after the floor
    // e.g. if whiteElo was 402 and change was -10,
    // actual change is only -2 (to stay at 400)
    whiteEloChange = newWhiteElo - whiteElo
    blackEloChange = newBlackElo - blackElo

    // save the game to MongoDB
    const game = await Game.create({
      whitePlayer: {
        userId:   whiteUser._id,
        username: whiteUser.username,
        elo:      whiteElo
      },
      blackPlayer: {
        userId:   blackUser._id,
        username: blackUser.username,
        elo:      blackElo
      },
      result,
      endReason,
      moves,
      duration,
      whiteEloChange,
      blackEloChange
    })

    console.log("Game saved:", game._id) // debug log

    // update white player stats in DB
    await User.findByIdAndUpdate(whiteUser._id, {
      $set: { elo: newWhiteElo },
      $inc: {
        wins:   result === "white" ? 1 : 0,
        losses: result === "black" ? 1 : 0,
        draws:  result === "draw"  ? 1 : 0
      }
    })

    // update black player stats in DB
    await User.findByIdAndUpdate(blackUser._id, {
      $set: { elo: newBlackElo },
      $inc: {
        wins:   result === "black" ? 1 : 0,
        losses: result === "white" ? 1 : 0,
        draws:  result === "draw"  ? 1 : 0
      }
    })

    console.log(`White ELO: ${whiteElo} → ${newWhiteElo} (${whiteEloChange > 0 ? "+" : ""}${whiteEloChange})`)
    console.log(`Black ELO: ${blackElo} → ${newBlackElo} (${blackEloChange > 0 ? "+" : ""}${blackEloChange})`)

    res.json({ game, whiteEloChange, blackEloChange })

  } catch (err) {
    console.error("Error saving game:", err)
    res.status(500).json({ message: err.message })
  }
})

// ── GET /api/games/history ───────────────────────────────
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId
    console.log("Fetching history for:", userId) // debug log

    const games = await Game.find({
      $or: [
        { "whitePlayer.userId": userId },
        { "blackPlayer.userId": userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(10)

    console.log("Games found:", games.length) // debug log
    res.json(games)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router