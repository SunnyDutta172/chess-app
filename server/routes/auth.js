const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
router.post("/register", async (req, res) => {
    try {
        const {username, email, password} = req.body
        const existing = await User.findOne({
            $or: [{email},{username}]
        })
        if(existing){
            return res.status(400).json({message: "Username or email already taken"})
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            email,
            password: hashedPassword
        })
        const token = jwt.sign(
            {userId: user._id, username: user.username},
            process.env.JWT_SECRET,
            {expiresIn: "7d"}
        )
        res.status(201).json({
            token,
            user: {id: user._id, username: user.username, email: user.email}
        })
    } catch(err) {
        res.status(500).json({message: "Server error", error: err.message})
    }
})
router.post("/login", async (req, res) => {
    try {
        const {username, password} = req.body
        const user = await User.findOne({
            $or: [{username}, {email: username}]
        })
        if(!user){
            return res.status(400).json({message: "Invalid Credentials"})
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
            return res.status(400).json({message: "Invalid Credentials"})
        }
        const token = jwt.sign(
            {userId: user._id, username: user.username},
            process.env.JWT_SECRET,
            {expiresIn: "7d"}
        )
        res.json({
            token,
            user: {id: user._id, username: user.username, email: user.email}
        })
    } catch(err) {
        res.status(500).json({message: "Server error", error: err.message})
    }
})

module.exports = router