//handles profiles, friends and elo
const express = require("express")
const router = express.Router()
const User = require("../models/User")
const jwt = require("jsonwebtoken")
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]
    if(!token){
        return res.status(401).json({message: "No token provided"})
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    } catch {
        res.status(401).json({message: "Invalid token"})
    }
}
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
        .select("-password")
        .populate("friends", "username elo isOnline")
        .populate("friendRequests", "username elo")
    if(!user) return res.status(404).json({message: "User not found"})
    res.json(user)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})
router.get("/search", authMiddleware, async (req, res) => {
    try {
        const {username} = req.query
        const users = await User.find({
            username: { $regex: username, $options: "i"},
            _id: { $ne: req.user.userId}
        })
        .select("username elo isOnline")
        .limit(10)
        res.json(users)
    } catch (err) {
        res.status(500).json({ message: err.message})
    }
})
router.post("/friend-request", authMiddleware, async (req, res) => {
    try {
        const {targetUserId} = req.body
        await User.findByIdAndUpdate(targetUserId, {
            $addToSet: {friendRequests: req.user.userId}
        })
        res.json({ message: "Friend request sent!" })
    } catch (err) {
        res.status(500).json({ message: err.message})
    }
})
router.post("/accept-friend", authMiddleware, async (req, res) => {
    try {
        const {requesterId} = req.body
        const userId = req.user.userId
        await User.findByIdAndUpdate(userId, {
            $addToSet: { friends: requesterId },
            $pull: { friendRequests: requesterId }
        })
        await User.findByIdAndUpdate(requesterId, {
            $addToSet: { friends: userId}
        })
        res.json({ message: "Friend added!" })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})
// TEMPORARY — run once to fix existing users
// Visit: http://localhost:5000/api/users/fix-elo
// Then DELETE this route
// router.get("/fix-elo", async (req, res) => {
//   try {
//     // update all users where elo is 0 or missing
//     const result = await User.updateMany(
//       { $or: [{ elo: 0 }, { elo: { $exists: false } }] },
//       { $set: { elo: 400 } }
//     )
//     res.json({ message: `Fixed ${result.modifiedCount} users` })
//   } catch (err) {
//     res.status(500).json({ message: err.message })
//   }
// })

module.exports = router