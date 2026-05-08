const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },
        password: {
            type: String,
            required: true,
            minlength: 6
        },
        //ELO Rating 
        elo: {
            type: Number,
            default: 400
        },
        wins: {type: Number, default: 0},
        losses: {type: Number, default: 0},
        draws: {type: Number, default: 0},
        //friends = array of user Ids
        friends: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        friendRequests: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        isOnline: {type: Boolean, default: false}
    },
    { timestamps: true }
)
module.exports = mongoose.model("User", userSchema);